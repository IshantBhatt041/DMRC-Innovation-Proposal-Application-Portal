// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Used to generate a unique Application ID
const bcrypt = require('bcryptjs'); // Used for secure password encryption
const nodemailer = require('nodemailer'); // 🎯 EMAIL NOTIFICATIONS
const jwt = require('jsonwebtoken'); // 🎯 JWT AUTHENTICATION
const { body, validationResult } = require('express-validator'); // 🎯 INPUT VALIDATION
const http = require('http'); // 🎯 SOCKET.IO — needs a raw http server to attach to
const { Server } = require('socket.io'); // 🎯 SOCKET.IO — real-time new-application badge

const app = express();
app.use(require('helmet')({
    // Cross-Origin-Resource-Policy relaxed so uploaded files / uploads route still load cross-origin from the frontend
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // 🎯 Content-Security-Policy OFF — the frontend pages (index1.html, view.html,
    // login pages) rely heavily on inline onclick="..."/onsubmit="..." handlers.
    // Helmet's default CSP blocks inline scripts, which silently broke things like
    // the section accordions once the frontend started being served from this same
    // server. All other Helmet protections (X-Frame-Options, etc.) stay active.
    contentSecurityPolicy: false
}));
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serves uploaded files statically

// 🎯 SERVE FRONTEND FILES DIRECTLY — no Live Server needed anymore.
// Put index1.html, view.html, login_admin.html, login_users.html, script.js,
// style.css, DMRC logo.png etc. in the SAME folder as server.js. Express will
// serve all of them automatically from http://localhost:5000/
app.use(express.static(__dirname));

// 🎯 SOCKET.IO — real-time new-application badge on the admin dashboard.
// Express needs to run on top of a raw http server so Socket.io can attach to it.
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' }
});

io.on('connection', (socket) => {
    console.log('Admin dashboard connected for real-time updates:', socket.id);
    socket.on('disconnect', () => {
        console.log('Admin dashboard disconnected:', socket.id);
    });
});

// 🎯 JWT AUTHENTICATION — secret + helpers.
// Change JWT_SECRET to a long random string in production (e.g. via an env var).
const JWT_SECRET = 'dmrc-portal-super-secret-change-this-in-production';
const JWT_EXPIRY = '2h';

function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

// Middleware — protects admin-only routes. Expects: Authorization: Bearer <token>
function requireAdminAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Access denied. No authentication token provided." });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: "Session expired or invalid token. Please log in again." });
        }
        if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Admin privileges required." });
        }
        req.admin = decoded;
        next();
    });
}

// 🔒 PER-ACCOUNT LOGIN LOCKOUT CONFIG
// Replaces the old IP-based express-rate-limit approach. Failed attempts are now
// tracked PER ACCOUNT (per email) in the database — success resets the counter,
// 5 consecutive failures locks that specific account for LOCK_DURATION_MS.
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// The fixed root admin (admin_dmrc) is not a DB row, so its attempt/lock state
// is tracked here in memory instead. Note: this resets if the server restarts.
let fixedAdminAttemptTracker = { count: 0, lockedUntil: null };

// 🎯 EMAIL NOTIFICATIONS — Nodemailer transporter config.
// Fill in your real sender email + app password below (for Gmail, use an
// "App Password", not your normal login password: https://myaccount.google.com/apppasswords).
// This never blocks form submission — if email sending fails, the applicant's
// submission is still saved, we just log the mail error to the console.
const EMAIL_SENDER = 'dmrcinnovationportal01@gmail.com';       // <-- change this
const EMAIL_APP_PASSWORD = 'zlrr jllt ugel blqu';    // <-- change this
const ADMIN_NOTIFICATION_EMAIL = 'admin@dmrc.com';         // <-- where new-submission alerts go

const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_SENDER,
        pass: EMAIL_APP_PASSWORD
    }
});

function sendApplicationEmails(applicationId, companyName, applicantEmail) {
    const emailFooter = `
        <tr>
            <td style="padding:20px 32px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:12px; color:#64748b;">
                This is an automated message from the DMRC Innovation Proposal Portal. Please do not reply directly to this email.
            </td>
        </tr>
    `;
    const emailWrapperStart = `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9; padding:32px 0; font-family: 'Segoe UI', Arial, sans-serif;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" style="max-width:520px; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.06);">
                        <tr>
                            <td style="background:#1e3a8a; padding:22px 32px;">
                                <span style="color:#ffffff; font-size:18px; font-weight:700; letter-spacing:0.3px;">DMRC Innovation Proposal Portal</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:32px; color:#1e293b; font-size:14px; line-height:1.65;">
    `;
    const emailWrapperEnd = `
                            </td>
                        </tr>
                        ${emailFooter}
                    </table>
                </td>
            </tr>
        </table>
    `;

    if (applicantEmail) {
        mailTransporter.sendMail({
            from: `"DMRC Innovation Portal" <${EMAIL_SENDER}>`,
            to: applicantEmail,
            subject: `Application Received — ${applicationId}`,
            html: `
                ${emailWrapperStart}
                <p>Dear Applicant,</p>
                <p>Thank you for submitting your innovation proposal for <strong>${companyName}</strong> to Delhi Metro Rail Corporation Ltd. (DMRC). We have successfully received your application.</p>
                <table role="presentation" width="100%" style="margin:20px 0; background:#eef2ff; border:1px solid #c7d2fe; border-radius:8px;">
                    <tr>
                        <td style="padding:16px 20px;">
                            <span style="font-size:12px; font-weight:600; color:#475569; text-transform:uppercase; letter-spacing:0.5px;">Your Application ID</span><br>
                            <span style="font-size:20px; font-weight:800; color:#1e3a8a;">${applicationId}</span>
                        </td>
                    </tr>
                </table>
                <p>Please retain this Application ID for future reference — you will need it to track the status of your proposal through the applicant portal's <em>"Check Application Status"</em> option.</p>
                <p>Our team will review your submission, and you will be notified of any update to your application status.</p>
                <p style="margin-top:28px;">Regards,<br><strong>DMRC</strong><br>Delhi Metro Rail Corporation Ltd.</p>
                ${emailWrapperEnd}
            `
        }, (err) => {
            if (err) console.error('Error sending applicant confirmation email:', err);
            else console.log(`Confirmation email sent to applicant (${applicantEmail}).`);
        });
    }

    mailTransporter.sendMail({
        from: `"DMRC Innovation Portal" <${EMAIL_SENDER}>`,
        to: ADMIN_NOTIFICATION_EMAIL,
        subject: `New Application Submitted — ${applicationId}`,
        html: `
            ${emailWrapperStart}
            <p>A new innovation proposal has been submitted through the portal and is awaiting review.</p>
            <table role="presentation" width="100%" style="margin:20px 0; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
                <tr>
                    <td style="padding:16px 20px; font-size:14px;">
                        <strong>Company:</strong> ${companyName}<br>
                        <strong>Application ID:</strong> ${applicationId}
                    </td>
                </tr>
            </table>
            <p>Please log in to the admin dashboard to review the full submission and update its status.</p>
            <p style="margin-top:28px;">Regards,<br><strong>DMRC</strong><br>Delhi Metro Rail Corporation Ltd.</p>
            ${emailWrapperEnd}
        `
    }, (err) => {
        if (err) console.error('Error sending admin notification email:', err);
        else console.log('Admin notification email sent.');
    });
}

// 1. MySQL Database Connection Configuration
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',       // Change this to your MySQL username if different (default is 'root')
    password: '',       // Change this to your MySQL password if configured
    database: 'dmrc'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('SQL Database connected successfully!');
    }
});

// Allowed status values for application tracking (used to validate admin updates)
const VALID_APPLICATION_STATUSES = ['Pending', 'Under Review', 'Approved', 'Rejected'];

// 2. Multer Configuration for Handling File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // All uploaded files will be stored in the 'uploads' folder
    },
    filename: (req, file, cb) => {
        // Appending timestamp to file name to prevent duplication conflicts
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// 3. API Endpoint - Handles complete form texts and file uploads simultaneously
// Accepting a maximum of 30 files since the application form contains multiple attachments
app.post('/api/submit-form', upload.any(), (req, res) => {
    try {
        const formData = req.body;
        const files = req.files || [];

        // 🎯 INPUT VALIDATION (backend) — sanity-check the critical fields even though
        // the frontend already validates; a request can always bypass the browser.
        if (!formData.company_name || !formData.company_name.trim()) {
            return res.status(400).json({ success: false, message: "Company name is required." });
        }
        if (!formData.company_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.company_email)) {
            return res.status(400).json({ success: false, message: "A valid company email is required." });
        }

        // Generating a unique custom Application ID for the VARCHAR Primary Key
        const applicationId = 'DMRC-' + uuidv4().substring(0, 8).toUpperCase();

        // Mapping all incoming file paths based on form fieldnames sent from the frontend's
        // `name="..."` attributes (these are now stable, human-readable keys instead of
        // index-based field_0, field_1... which used to break whenever a field was added/removed).
        const filePaths = {};
        files.forEach(file => {
            filePaths[file.fieldname] = 'uploads/' + file.filename;
        });

        // Helper to safely read a text/select/radio/checkbox field by its name.
        // Returns null if absent so optional columns don't crash the insert.
        const f = (name) => (formData[name] !== undefined ? formData[name] : null);
        // Helper for file fields - returns the saved path or null.
        const ff = (name) => (filePaths[name] !== undefined ? filePaths[name] : null);

        // SQL Query structured explicitly based on the DMRC application requirement guidelines.
        // Column order below must exactly match the `columns` array order below it.
        const columns = [
            'application_id', 'company_name', 'company_address_website_email', 'company_brief_details_background',
            'company_year_and_certificate', 'uploaded_certificate_incorporation_path', 'uploaded_power_of_attorney_path',
            'company_entity_type', 'uploaded_entity_type_document_path', 'is_startup_recognized_dpiit',
            'uploaded_dpiit_proof_path', 'is_msme_registered', 'uploaded_udyam_registration_path',
            'turnover_amount_2025_26', 'uploaded_balance_sheet_2025_26_path', 'turnover_amount_2024_25',
            'uploaded_balance_sheet_2024_25_path', 'turnover_amount_2023_24', 'uploaded_balance_sheet_2023_24_path',
            'confirm_not_formed_by_splitting', 'problem_statement', 'product_description_and_technology',
            'hardware_software_details', 'uploaded_proposed_solution_deck_path', 'technology_involved_details',
            'uploaded_technology_relevant_docs_path', 'current_product_service_status', 'has_ipr_covering_concept',
            'has_freedom_to_operate_india', 'uploaded_ipr_relevant_document_path', 'product_validation_reference_standard',
            'uploaded_reference_standard_doc_path', 'testing_facility_infrastructure_required', 'uploaded_testing_facility_doc_path',
            'support_required_from_dmrc', 'benefits_that_would_accrue_to_dmrc', 'intended_user_and_payer',
            'founder1_name', 'founder1_nationality', 'founder1_shareholding_percentage', 'founder1_linkedin_url_email',
            'founder1_mobile_no', 'founder1_address', 'founder1_identity_proof_type', 'uploaded_founder1_id_proof_path',
            'founder2_name', 'founder2_nationality', 'founder2_shareholding_percentage', 'founder2_linkedin_url_email',
            'founder2_mobile_no', 'founder2_address', 'founder2_identity_proof_type', 'uploaded_founder2_id_proof_path',
            'uploaded_shareholding_percentage_doc_path', 'founders_relationship_duration_background', 'has_founders_agreement',
            'uploaded_founders_agreement_copy_path', 'team_domains_of_expertise', 'has_pending_criminal_cases',
            'criminal_cases_details', 'uploaded_criminal_no_case_declaration_path', 'is_blacklisted_last_3_years',
            'blacklisted_details', 'uploaded_blacklisted_docs_or_declaration_path', 'has_pending_litigations_arbitration',
            'litigation_details', 'uploaded_litigation_docs_or_declaration_path', 'is_declared_financial_defaulter',
            'uploaded_financial_defaulter_declaration_path', 'is_founder_current_former_dmrc_employee', 'dmrc_employee_founder_details',
            'is_founder_related_to_dmrc_employee', 'dmrc_related_employee_details', 'uploaded_performance_certificates_path',
            'manufacturing_capability_details', 'uploaded_manufacturing_capability_docs_path', 'product_quality_certifications_details',
            'uploaded_product_quality_certs_path', 'proposed_product_validations_details', 'uploaded_proposed_product_validations_path',
            'uploaded_company_organisation_chart_path', 'after_sales_support_organisation_details', 'uploaded_after_sales_support_docs_path',
            'uploaded_project_cost_detailed_breakup_path', 'seeks_seed_funding_from_dmrc', 'seed_funding_quantum_and_utilization_details',
            'seeks_mobilisation_advance_from_dmrc', 'business_potential_and_roi_plan', 'uploaded_business_potential_roi_docs_path',
            'uploaded_existing_investors_details_path', 'external_funds_raised_till_date_inr_lakhs', 'market_trend_size_and_intended_price',
            'competitors_differentiation_advantage', 'uploaded_project_milestones_timeline_path', 'startup_sector_domain',
            'startup_idea_reason_and_user_need', 'uploaded_startup_composition_registration_path', 'uploaded_founders_ceo_techhead_cv_credentials_path',
            'uploaded_detailed_pitch_deck_presentation_path', 'applicant_confirm_and_submit_declaration'
        ];

        // Values pulled by NAME from the frontend's `name="..."` attributes (matches index.html).
        // This is what actually fixes the silent-submit-failure: previously this used
        // formData.field_0, field_1... which shifted/broke whenever the form changed.
        const values = [
            applicationId,
            f('company_name'),
            `${f('company_address')} | Website: ${f('company_website')} | Email: ${f('company_email')}`,
            f('company_brief_details'),
            f('year_of_incorporation'),
            ff('certificate_of_incorporation_file'),
            ff('power_of_attorney_file'),
            f('entity_type'),
            ff('entity_type_document_file'),
            f('dpiit_radio'),
            ff('dpiit_proof_file'),
            f('mse_radio'),
            ff('udyam_registration_file'),
            f('turnover_2025_26'),
            ff('balance_sheet_2025_26_file'),
            f('turnover_2024_25'),
            ff('balance_sheet_2024_25_file'),
            f('turnover_2023_24'),
            ff('balance_sheet_2023_24_file'),
            f('confirm_not_split_entity') === 'true' ? 'Yes' : 'No',
            f('problem_statement'),
            f('product_description_tech_details'),
            f('product_description_tech_details'), // hardware/software details ab isi combined field mein hain
            ff('proposed_solution_deck_file'),
            f('technology_involved_details'),
            ff('technology_relevant_docs_file'),
            f('current_product_status'),
            f('ipr_details'),
            'Not collected separately (refer IPR details column)',
            ff('ipr_relevant_document_file'),
            f('reference_standard_details'),
            ff('reference_standard_doc_file'),
            f('testing_facility_details'),
            ff('testing_facility_doc_file'),
            f('support_required_from_dmrc'),
            f('benefits_to_dmrc'),
            f('intended_user_and_payer'),
            f('founder1_name'),
            f('founder1_nationality'),
            f('founder1_shareholding_percentage'),
            f('founder1_linkedin_url_email'),
            f('founder1_mobile_no'),
            f('founder1_address'),
            f('founder1_identity_proof_type'),
            ff('founder1_id_proof_file'),
            f('founder_name_2'),
            f('founder_nationality_2'),
            f('founder_share_2'),
            f('founder_linkedin_2'),
            f('founder_mobile_2'),
            f('founder_address_2'),
            f('founder_id_type_2'),
            ff('founder_id_doc_2'),
            ff('founder1_shareholding_doc_file'),
            f('founders_relationship_duration_background'),
            f('founders_agreement_radio'),
            ff('founders_agreement_file'),
            f('team_domains_of_expertise'),
            f('crim'),
            f('crim') === 'Yes' ? f('crim_details') : null,
            ff('criminal_no_case_declaration_file'),
            f('blist'),
            f('blist') === 'Yes' ? f('blist_details') : null,
            ff('blacklisted_docs_or_declaration_file'),
            f('lit'),
            f('lit') === 'Yes' ? f('lit_details') : null,
            ff('litigation_docs_or_declaration_file'),
            f('bankrupt'),
            ff('financial_defaulter_declaration_file'),
            f('dmrc_emp'),
            f('dmrc_employee_founder_details'),
            f('dmrc_rel'),
            f('dmrc_related_employee_details'),
            ff('performance_certificates_file'),
            f('manufacturing_capability_details'),
            ff('manufacturing_capability_docs_file'),
            f('product_quality_certifications_details'),
            ff('product_quality_certs_file'),
            f('proposed_product_validations_details'),
            ff('proposed_product_validations_file'),
            ff('organisation_chart_file'),
            f('after_sales_support_details'),
            ff('after_sales_support_docs_file'),
            ff('project_cost_detailed_breakup_file'),
            f('seed_f'),
            f('seed_funding_quantum_details'),
            f('mob_adv'),
            f('business_potential_roi_plan'),
            ff('business_potential_roi_docs_file'),
            ff('existing_investors_details_file'),
            f('external_funds_raised_inr_lakhs'),
            f('market_trend_size_and_price'),
            f('competitors_differentiation_advantage'),
            ff('project_milestones_timeline_file'),
            f('startup_sector_domain'),
            f('startup_idea_reason_and_user_need'),
            ff('startup_composition_registration_file'),
            ff('founders_ceo_techhead_cv_file'),
            ff('detailed_pitch_deck_presentation_file'),
            (f('applicant_confirm_and_submit_declaration') === 'true' || f('applicant_confirm_and_submit_declaration') === true) ? 1 : 0
        ];

        const placeholders = columns.map(() => '?').join(',');
        const sqlQuery = `INSERT INTO dmrc_all_sections_form (${columns.join(', ')}) VALUES (${placeholders})`;

        db.query(sqlQuery, values, (err, result) => {
            if (err) {
                console.error('SQL Execution Error:', err);
                return res.status(500).json({ success: false, message: "Database insertion failure: " + err.message });
            }

            // 🎯 EMAIL NOTIFICATIONS — fire-and-forget, never blocks the response
            sendApplicationEmails(applicationId, f('company_name'), f('company_email'));

            // 🎯 SOCKET.IO — notify all connected admin dashboards live, no refresh needed
            io.emit('newApplication', {
                applicationId,
                companyName: f('company_name'),
                entityType: f('entity_type'),
                submittedAt: new Date().toISOString()
            });

            res.status(200).json({ success: true, message: `Application submitted successfully. ID: ${applicationId}` });
        });

    } catch (error) {
        console.error('Internal Server Error:', error);
        res.status(500).json({ success: false, message: "Critical internal server error occurred: " + error.message });
    }
});

// 4. CONTROLLER VIEW API - Fetches all submitted applications for review
// 🎯 SEARCH + FILTER + PAGINATION — accepts optional query params:
//    search (company name), entityType, dateFrom, dateTo, page, limit
app.get('/api/admin/view-applications', requireAdminAuth, (req, res) => {
    const { search, entityType, dateFrom, dateTo, page = 1, limit = 10 } = req.query;

    const whereClauses = [];
    const queryParams = [];

    if (search) {
        whereClauses.push('company_name LIKE ?');
        queryParams.push(`%${search}%`);
    }
    if (entityType) {
        whereClauses.push('company_entity_type = ?');
        queryParams.push(entityType);
    }
    if (dateFrom) {
        whereClauses.push('submitted_at >= ?');
        queryParams.push(`${dateFrom} 00:00:00`);
    }
    if (dateTo) {
        whereClauses.push('submitted_at <= ?');
        queryParams.push(`${dateTo} 23:59:59`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.max(parseInt(limit) || 10, 1);
    const offset = (pageNum - 1) * limitNum;

    const countQuery = `SELECT COUNT(*) AS total FROM dmrc_all_sections_form ${whereSql}`;
    db.query(countQuery, queryParams, (countErr, countResult) => {
        if (countErr) {
            console.error('Error counting applications:', countErr);
            return res.status(500).json({ success: false, message: "Internal database count failure." });
        }

        const total = countResult[0].total;
        const dataQuery = `SELECT * FROM dmrc_all_sections_form ${whereSql} ORDER BY submitted_at DESC LIMIT ? OFFSET ?`;
        db.query(dataQuery, [...queryParams, limitNum, offset], (err, results) => {
            if (err) {
                console.error('Error fetching applications for controller view:', err);
                return res.status(500).json({ success: false, message: "Internal database retrieval failure." });
            }
            res.status(200).json({
                success: true,
                data: results,
                pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 }
            });
        });
    });
});


// 🎯 APPLICATION STATUS TRACKING — ADMIN: update status of one application via dropdown
app.patch('/api/admin/update-status/:applicationId', requireAdminAuth, (req, res) => {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!status || !VALID_APPLICATION_STATUSES.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Invalid status. Must be one of: ${VALID_APPLICATION_STATUSES.join(', ')}`
        });
    }

    const updateStatusQuery = `UPDATE dmrc_all_sections_form SET status = ? WHERE application_id = ?`;
    db.query(updateStatusQuery, [status, applicationId], (err, result) => {
        if (err) {
            console.error('Error updating application status:', err);
            return res.status(500).json({ success: false, message: "Database update failure while changing status." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "No application found with this Application ID." });
        }
        res.status(200).json({ success: true, message: `Status updated to "${status}" successfully.`, status });
    });
});


// 🎯 APPLICATION STATUS TRACKING — APPLICANT: check status of their own application by ID
app.get('/api/application-status/:applicationId', (req, res) => {
    const { applicationId } = req.params;

    const statusQuery = `SELECT application_id, company_name, status, submitted_at FROM dmrc_all_sections_form WHERE application_id = ?`;
    db.query(statusQuery, [applicationId], (err, results) => {
        if (err) {
            console.error('Error fetching application status:', err);
            return res.status(500).json({ success: false, message: "Database lookup failure while checking status." });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "No application found with this Application ID. Please check and try again." });
        }
        res.status(200).json({ success: true, data: results[0] });
    });
});


/* =========================================================================
    🔒 SECURITY MODULE: USER MANAGEMENT & ENCRYPTION APIS (NO EMOJIS)
    ========================================================================= */

// 5. --- USER REGISTRATION WITH SECURE PASSWORD HASHING ---
app.post('/api/register', [
    body('username').trim().notEmpty().withMessage('Username is required').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({ success: false, message: validationErrors.array()[0].msg, errors: validationErrors.array() });
    }

    const { username, email, password } = req.body;

    const checkUserQuery = "SELECT id FROM users WHERE email = ?";
    db.query(checkUserQuery, [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database lookup architecture error." });
        }
        if (results.length > 0) {
            return res.status(400).json({ success: false, message: "This Email ID is already registered on the portal." });
        }

        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const insertUserQuery = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
            db.query(insertUserQuery, [username, email, hashedPassword], (insertErr, insertResult) => {
                if (insertErr) {
                    console.error(insertErr);
                    return res.status(500).json({ success: false, message: "Registration processing sequence error." });
                }
                res.json({ success: true, message: "Account initialized successfully with enterprise encryption!" });
            });

        } catch (encryptionError) {
            console.error('Encryption Module Failure:', encryptionError);
            return res.status(500).json({ success: false, message: "Fatal error encrypting identity password." });
        }
    });
});

// 6. --- USER AUTHENTICATION GATEWAY (LOGIN API WITH DECRYPTION COMPARE) ---
// 🔒 PER-ACCOUNT LOCKOUT: tracks failed_attempts + locked_until on the `users` row
// itself (per email), instead of the old global IP-based rate limiter.
app.post('/api/login', [
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
], (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        return res.status(400).json({ success: false, message: validationErrors.array()[0].msg, errors: validationErrors.array() });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and Password parameters are required." });
    }

    const fetchUserQuery = "SELECT * FROM users WHERE email = ?";
    db.query(fetchUserQuery, [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Authentication database lookup failure." });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid Email ID or Password." });
        }

        const user = results[0];

        // 🔒 Account currently locked?
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
            return res.status(403).json({
                success: false,
                message: `Account locked due to multiple failed attempts. Try again after ${minutesLeft} minute(s).`
            });
        }

        try {
            const isPasswordMatch = await bcrypt.compare(password, user.password);

            if (isPasswordMatch) {
                // ✅ Success — reset failed-attempt counter for this account
                db.query("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?", [user.id]);
                const token = signToken({ id: user.id, email: user.email, role: 'user' });
                return res.json({ success: true, message: "Access Clearance Granted. Redirecting to Innovation Form...", token });
            } else {
                const newFailedCount = (user.failed_attempts || 0) + 1;
                const attemptsLeft = MAX_FAILED_ATTEMPTS - newFailedCount;

                if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
                    const lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
                    db.query("UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?", [newFailedCount, lockUntil, user.id]);
                    return res.status(403).json({
                        success: false,
                        message: "Account locked due to 5 failed attempts. Try again after 15 minutes."
                    });
                } else {
                    db.query("UPDATE users SET failed_attempts = ? WHERE id = ?", [newFailedCount, user.id]);
                    return res.status(401).json({
                        success: false,
                        message: "Invalid Email ID or Password.",
                        attemptsLeft
                    });
                }
            }
        } catch (compareError) {
            console.error(compareError);
            return res.status(500).json({ success: false, message: "Error parsing security credentials comparison matrix." });
        }
    });
});


// --- INITIALIZE APPLICATION INSTANCE SERVER ---
httpServer.listen(5000, () => {
    console.log("-------------------------------------------------------------------");
    console.log("DMRC Microservice Cluster Engine listening on Port: 5000");
    console.log("Password Encryption Engine Status: ACTIVE [Hashed Cryptography]");
    console.log("Real-time Socket.io Engine Status: ACTIVE");
    console.log("Per-Account Login Lockout Status: ACTIVE [5 attempts / 15 min]");
    console.log("-------------------------------------------------------------------");
});


/* =========================================================================
    🔒 ADMINISTRATIVE CORE MODULE (DYNAMIC EXPANSION - FIXED + DATABASE BACKED)
    ========================================================================= */
// 🔒 PER-ACCOUNT LOCKOUT: fixed root admin uses an in-memory tracker (it has no
// DB row); sub-admins use failed_attempts/locked_until on the portal_sub_admins row.
app.post('/api/admin-login', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: "All admin authentication fields are mandatory." });
    }

    // 1. Fixed root admin credentials check
    const FIXED_ADMIN_USER = "admin_dmrc";
    const FIXED_ADMIN_EMAIL = "admin@dmrc.com";
    const FIXED_ADMIN_PASS = "DmrcAdmin2026";

    if (username === FIXED_ADMIN_USER && email === FIXED_ADMIN_EMAIL) {
        // 🔒 Locked?
        if (fixedAdminAttemptTracker.lockedUntil && fixedAdminAttemptTracker.lockedUntil > Date.now()) {
            const minutesLeft = Math.ceil((fixedAdminAttemptTracker.lockedUntil - Date.now()) / 60000);
            return res.status(403).json({
                success: false,
                message: `Account locked due to multiple failed attempts. Try again after ${minutesLeft} minute(s).`
            });
        }

        if (password === FIXED_ADMIN_PASS) {
            // ✅ Success — reset
            fixedAdminAttemptTracker = { count: 0, lockedUntil: null };
            const token = signToken({ username, email, role: 'admin' });
            return res.json({
                success: true,
                message: "Administrative clearance verified. Accessing system vault...",
                redirectUrl: "view.html",
                token
            });
        } else {
            fixedAdminAttemptTracker.count += 1;
            const attemptsLeft = MAX_FAILED_ATTEMPTS - fixedAdminAttemptTracker.count;

            if (fixedAdminAttemptTracker.count >= MAX_FAILED_ATTEMPTS) {
                fixedAdminAttemptTracker.lockedUntil = Date.now() + LOCK_DURATION_MS;
                return res.status(403).json({
                    success: false,
                    message: "Account locked due to 5 failed attempts. Try again after 15 minutes."
                });
            }
            return res.status(401).json({
                success: false,
                message: "Access Denied. Invalid Administrative Credentials.",
                attemptsLeft
            });
        }
    }

    // 2. Fallback check: Search dynamically in the new 'portal_sub_admins' table if fixed parameters don't match
    const fetchSubAdminQuery = "SELECT * FROM portal_sub_admins WHERE email = ?";
    db.query(fetchSubAdminQuery, [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Admin space database connection failure." });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: "Access Denied. Invalid Administrative Credentials." });
        }

        const subAdmin = results[0];

        // 🔒 Locked?
        if (subAdmin.locked_until && new Date(subAdmin.locked_until) > new Date()) {
            const minutesLeft = Math.ceil((new Date(subAdmin.locked_until) - new Date()) / 60000);
            return res.status(403).json({
                success: false,
                message: `Account locked due to multiple failed attempts. Try again after ${minutesLeft} minute(s).`
            });
        }

        try {
            // Symmetrical bcrypt password decrypt match check
            const isPasswordMatch = await bcrypt.compare(password, subAdmin.password);
            if (isPasswordMatch) {
                // ✅ Success — reset
                db.query("UPDATE portal_sub_admins SET failed_attempts = 0, locked_until = NULL WHERE id = ?", [subAdmin.id]);
                const token = signToken({ id: subAdmin.id, email: subAdmin.email, role: 'admin' });
                return res.json({
                    success: true,
                    message: `Clearance verified. Welcome back, ${subAdmin.name}!`,
                    redirectUrl: "view.html",
                    token
                });
            } else {
                const newFailedCount = (subAdmin.failed_attempts || 0) + 1;
                const attemptsLeft = MAX_FAILED_ATTEMPTS - newFailedCount;

                if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
                    const lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
                    db.query("UPDATE portal_sub_admins SET failed_attempts = ?, locked_until = ? WHERE id = ?", [newFailedCount, lockUntil, subAdmin.id]);
                    return res.status(403).json({
                        success: false,
                        message: "Account locked due to 5 failed attempts. Try again after 15 minutes."
                    });
                } else {
                    db.query("UPDATE portal_sub_admins SET failed_attempts = ? WHERE id = ?", [newFailedCount, subAdmin.id]);
                    return res.status(401).json({
                        success: false,
                        message: "Access Denied. Invalid Administrative Credentials.",
                        attemptsLeft
                    });
                }
            }
        } catch (compareErr) {
            console.error(compareErr);
            return res.status(500).json({ success: false, message: "Internal cryptography decryption mismatch." });
        }
    });
});


// 🎯 NEW ENDPOINT: CREATES SUB ADMISSIONS ACCOUNT GENERATION NODES WITH BCRYPT HASHING
app.post('/api/admin/users', requireAdminAuth, async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All sub-admin creation fields are mandatory." });
    }

    const checkDupQuery = "SELECT id FROM portal_sub_admins WHERE email = ?";
    db.query(checkDupQuery, [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Sub-admin verification matrix failure." });
        }
        if (results.length > 0) {
            return res.json({ success: false, message: "This email account identifier is already a portal admin." });
        }

        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const insertSubAdminQuery = "INSERT INTO portal_sub_admins (name, email, password) VALUES (?, ?, ?)";
            db.query(insertSubAdminQuery, [name, email, hashedPassword], (insErr, result) => {
                if (insErr) {
                    console.error(insErr);
                    return res.status(500).json({ success: false, message: "Failed to allocate sub-admin storage index." });
                }
                res.json({ success: true, message: "New Administrator identity stored inside database vault successfully." });
            });
        } catch (hashError) {
            console.error(hashError);
            return res.status(500).json({ success: false, message: "Sub-admin secure encryption generation sequence error." });
        }
    });
});


// 🎯 NEW ENDPOINT: FETCHES LIST OF SUB-ADMIN RECORDS TO DISPLAY IN THE MODAL VIEW TABLE
app.get('/api/admin/users', requireAdminAuth, (req, res) => {
    const fetchAdminsQuery = "SELECT name, email FROM portal_sub_admins ORDER BY created_at DESC";
    db.query(fetchAdminsQuery, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Failed to extract sub-admin accounts schema vector data." });
        }
        res.status(200).json({ success: true, data: results });
    });
});


// FORGOT PASSWORD ARCHITECTURE ENGINE STUB
app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email validation target parameter missing." });

    // Check if user identity exists inside primary tables
    db.query("SELECT id FROM users WHERE email = ?", [email], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Database tracing failure." });
        if (results.length === 0) return res.status(404).json({ success: false, message: "This Email ID is not registered inside DMRC system vectors." });

        // Success placeholder route
        res.json({ success: true, message: "Reset configuration processed successfully." });
    });
});