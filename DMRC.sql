CREATE DATABASE IF NOT EXISTS dmrc;
USE dmrc;


 
    
  -- Purane table ko safely drop karo pehle
DROP TABLE IF EXISTS dmrc_all_sections_form;


CREATE TABLE dmrc_all_sections_form (
    -- --- AUTOMATIC UNIQUE ID ---
    application_id VARCHAR(50) NOT NULL PRIMARY KEY,

    -- =========================================================================
    -- SECTION 1: COMPANY INFORMATION/DETAILS
    -- =========================================================================
    company_name VARCHAR(255) NOT NULL,                              -- 1(a) Name of company
    company_address_website_email TEXT NOT NULL,                     -- 1(b) Address, Website details and e-mail id
    company_brief_details_background TEXT NOT NULL,                  -- 1(c) Brief Details and background about the company
    company_year_and_certificate VARCHAR(255) NOT NULL,              -- 1(d) Year of Incorporation
    uploaded_certificate_incorporation_path VARCHAR(255) NOT NULL,   -- 1(d) Upload Certificate of Incorporation (Notarised)
    uploaded_power_of_attorney_path VARCHAR(255) NOT NULL,           -- 1(e) Upload Power of Attorney (Notarised)
    company_entity_type VARCHAR(100) NOT NULL,                       -- 1(f) Entity Type (Sole Proprietorship/Partnership/Company/JV/Consortium)
    uploaded_entity_type_document_path VARCHAR(255) NOT NULL,        -- 1(f) Upload Relevant document for Entity Type
    is_startup_recognized_dpiit ENUM('Yes', 'No') NOT NULL,          -- 1(g) Is the entity a Start up as recognised by DPIIT
    uploaded_dpiit_proof_path VARCHAR(255) NULL,                     -- 1(g) Upload proof of registration with DPIIT as Start-up
    is_msme_registered ENUM('Yes', 'No') NOT NULL,                   -- 1(h) Is the entity a Micro or Small Enterprise (MSE)
    uploaded_udyam_registration_path VARCHAR(255) NULL,              -- 1(h) Upload Udyam Registration as manufacturers/service providers
    turnover_amount_2025_26 VARCHAR(50) NOT NULL,                    -- 1(i) TURNOVER of the Company in 2025-26
    uploaded_balance_sheet_2025_26_path VARCHAR(255) NOT NULL,       -- 1(i) 2025-26: Upload Audited Balance Sheet
    turnover_amount_2024_25 VARCHAR(50) NOT NULL,                    -- 1(i) TURNOVER of the Company in 2024-25
    uploaded_balance_sheet_2024_25_path VARCHAR(255) NOT NULL,       -- 1(i) 2024-25: Upload Audited Balance Sheet
    turnover_amount_2023_24 VARCHAR(50) NOT NULL,                    -- 1(i) TURNOVER of the Company in 2023-24
    uploaded_balance_sheet_2023_24_path VARCHAR(255) NOT NULL,       -- 1(i) 2023-24: Upload Audited Balance Sheet
    confirm_not_formed_by_splitting ENUM('Yes', 'No') NOT NULL,      -- 1(j) Confirm company has not been formed by splitting/reconstruction

    -- =========================================================================
    -- SECTION 2: BRIEF DETAILS OF PRODUCT/SOFTWARE/SOLUTION
    -- =========================================================================
    problem_statement TEXT NOT NULL,                                 -- 2(a) Problem Statement likely to be solved
    product_description_and_technology TEXT NOT NULL,                -- 2(b) Describe product, solution and Technology being used
    hardware_software_details TEXT NOT NULL,                         -- 2(b) Hardware- Software details
    uploaded_proposed_solution_deck_path VARCHAR(255) NOT NULL,      -- 2(b) Upload details/presentation & link to video demo/slide deck
    technology_involved_details TEXT NOT NULL,                       -- 2(c) Details about Technology Involved (Literature, prototype etc.)
    uploaded_technology_relevant_docs_path VARCHAR(255) NOT NULL,    -- 2(c) Upload relevant documents
    current_product_service_status VARCHAR(150) NOT NULL,            -- 2(d) Current status of your product/service
    has_ipr_covering_concept TEXT NOT NULL,                          -- 2(e) Do you have intellectual property right (IPR) of your own?
    has_freedom_to_operate_india TEXT NOT NULL,                      -- 2(e) Do you have freedom to operate in India?
    uploaded_ipr_relevant_document_path VARCHAR(255) NULL,           -- 2(e) Upload relevant document if applicable
    product_validation_reference_standard TEXT NULL,                 -- 2(f) Any Reference Standard for product validation
    uploaded_reference_standard_doc_path VARCHAR(255) NULL,          -- 2(f) Upload relevant document if applicable
    testing_facility_infrastructure_required TEXT NULL,              -- 2(g) Testing Facility/Infrastructure required
    uploaded_testing_facility_doc_path VARCHAR(255) NULL,            -- 2(g) Upload relevant document if applicable
    support_required_from_dmrc TEXT NOT NULL,                        -- 2(h) Support required from DMRC
    benefits_that_would_accrue_to_dmrc TEXT NOT NULL,                -- 2(i) Benefits that would accrue to DMRC (Cost, Reliability, Manpower)
    intended_user_and_payer TEXT NOT NULL,                           -- 2(j) Who will use and pay for the product/service/solution

    -- =========================================================================
    -- SECTION 3: INFORMATION ABOUT FOUNDERS OF COMPANY
    -- =========================================================================
    -- --- FOUNDER 1 ---
    founder1_name VARCHAR(150) NOT NULL,                             -- 3(a) Name of the founder 1
    founder1_nationality VARCHAR(100) NOT NULL,                      -- 3(a) Nationality
    founder1_shareholding_percentage VARCHAR(50) NOT NULL,           -- 3(a) Shareholding of each founder
    founder1_linkedin_url_email VARCHAR(255) NOT NULL,               -- 3(a) LinkedIn profile/ URL/email id
    founder1_mobile_no VARCHAR(20) NOT NULL,                         -- 3(a) Mobile No
    founder1_address TEXT NOT NULL,                                  -- 3(a) Address of founder member
    founder1_identity_proof_type VARCHAR(50) NOT NULL,               -- 3(a) Identity Proof Type (Aadhar/ PAN/Voter ID)
    uploaded_founder1_id_proof_path VARCHAR(255) NOT NULL,           -- 3(a) Upload document for identity proof
    
    -- --- FOUNDER 2 ---
    founder2_name VARCHAR(150) NULL,                                 -- 3(a) Name of the founder 2
    founder2_nationality VARCHAR(100) NULL,                          -- 3(a) Nationality
    founder2_shareholding_percentage VARCHAR(50) NULL,               -- 3(a) Shareholding of each founder
    founder2_linkedin_url_email VARCHAR(255) NULL,                   -- 3(a) LinkedIn profile/ URL/email id
    founder2_mobile_no VARCHAR(20) NULL,                             -- 3(a) Mobile No
    founder2_address TEXT NULL,                                      -- 3(a) Address of founder member
    founder2_identity_proof_type VARCHAR(50) NULL,                   -- 3(a) Identity Proof Type
    uploaded_founder2_id_proof_path VARCHAR(255) NULL,               -- 3(a) Upload document for identity proof
    
    uploaded_shareholding_percentage_doc_path VARCHAR(255) NOT NULL, -- 3(a) Upload document for shareholding percentage
    founders_relationship_duration_background TEXT NOT NULL,         -- 3(b) How long known one another? How did they come together?
    has_founders_agreement ENUM('Yes', 'No') NOT NULL,               -- 3(c) Is there a founder’s agreement in place?
    uploaded_founders_agreement_copy_path VARCHAR(255) NULL,         -- 3(c) If Yes Upload founder’s agreement copy
    team_domains_of_expertise TEXT NOT NULL,                         -- 3(d) What are the domains of expertise of the team members?
    has_pending_criminal_cases ENUM('Yes', 'No') NOT NULL,           -- 3(e) Are there any pending criminal cases?
    criminal_cases_details TEXT NULL,                                -- 3(e) If yes, provide details
    uploaded_criminal_no_case_declaration_path VARCHAR(255) NULL,    -- 3(e) If No Upload declaration signed by authorised signatory
    is_blacklisted_last_3_years ENUM('Yes', 'No') NOT NULL,          -- 3(f) Is the Company or founders blacklisted in the last 3 years?
    blacklisted_details TEXT NULL,                                   -- 3(f) If yes please provide details
    uploaded_blacklisted_docs_or_declaration_path VARCHAR(255) NOT NULL, -- 3(f) Upload docs for details / If No Upload declaration
    has_pending_litigations_arbitration ENUM('Yes', 'No') NOT NULL,  -- 3(g) Details of pending Litigations/Arbitration in last 3 years
    litigation_details TEXT NULL,                                    -- 3(g) If yes please provide details
    uploaded_litigation_docs_or_declaration_path VARCHAR(255) NOT NULL,  -- 3(g) Upload docs for details / If No Upload declaration
    is_declared_financial_defaulter ENUM('Yes', 'No') NOT NULL,      -- 3(h) Declared Financial Defaulter, Bankrupt or insolvent?
    uploaded_financial_defaulter_declaration_path VARCHAR(255) NOT NULL, -- 3(h) If No Upload declaration signed by authorised signatory
    is_founder_current_former_dmrc_employee ENUM('Yes', 'No') NOT NULL,  -- 3(i) Founders current or former employees of DMRC?
    dmrc_employee_founder_details TEXT NULL,                         -- 3(i) If Yes please provide details
    is_founder_related_to_dmrc_employee ENUM('Yes', 'No') NOT NULL,  -- 3(j) Founders related to any current or former employees of DMRC?
    dmrc_related_employee_details TEXT NULL,                         -- 3(j) If Yes please provide details

    -- =========================================================================
    -- SECTION 4: COMPANY CREDENTIALS; PAST EXPERIENCE
    -- =========================================================================
    uploaded_performance_certificates_path VARCHAR(255) NOT NULL,    -- 4(a) Details of at least 3 performance certificates of end clients
    manufacturing_capability_details TEXT NOT NULL,                  -- 4(b) Manufacturing Capability of the offered product
    uploaded_manufacturing_capability_docs_path VARCHAR(255) NOT NULL, -- 4(b) Upload manufacturing capability documents
    product_quality_certifications_details TEXT NULL,                -- 4(c) Details of the Certifications achieved by firm
    uploaded_product_quality_certs_path VARCHAR(255) NULL,           -- 4(c) Upload Valid Certifications, if any
    proposed_product_validations_details TEXT NULL,                  -- 4(d) Details of Certifications/Validations received for product
    uploaded_proposed_product_validations_path VARCHAR(255) NULL,    -- 4(d) Upload Valid Certifications/Validations, if any
    uploaded_company_organisation_chart_path VARCHAR(255) NOT NULL,  -- 4(e) Manpower Details: Upload Company Organisation Chart, CVs etc.
    after_sales_support_organisation_details TEXT NOT NULL,          -- 4(f) After Sales Support; Details of Service support organisation
    uploaded_after_sales_support_docs_path VARCHAR(255) NOT NULL,    -- 4(f) Upload after sales support documents

    -- =========================================================================
    -- SECTION 5: PROJECT COST DETAILS
    -- =========================================================================
    uploaded_project_cost_detailed_breakup_path VARCHAR(255) NOT NULL, -- 5(a) Detailed breakup of cost incurred and proposed to be borne by DMRC
    seeks_seed_funding_from_dmrc ENUM('Yes', 'No') NOT NULL,         -- 5(b) Does the applicant seeks any Seed Funding from DMRC?
    seed_funding_quantum_and_utilization_details TEXT NULL,          -- 5(b) Seed funding amount, quantum and utilization details
    seeks_mobilisation_advance_from_dmrc ENUM('Yes', 'No') NOT NULL, -- 5(c) Does he also seek a Mobilisation Advance from DMRC?
    business_potential_and_roi_plan TEXT NOT NULL,                   -- 5(d) Business potential of product and business plan regarding ROI
    uploaded_business_potential_roi_docs_path VARCHAR(255) NOT NULL, -- 5(d) Upload business potential ROI documents
    uploaded_existing_investors_details_path VARCHAR(255) NOT NULL,  -- 5(e) Details of Existing Investors, nature, period, shareholding
    external_funds_raised_till_date_inr_lakhs VARCHAR(50) NOT NULL,  -- 5(f) How much money have you raised from external investors?
    market_trend_size_and_intended_price TEXT NOT NULL,              -- 5(g)/5(h) Market trend, size and intended market price
    competitors_differentiation_advantage TEXT NOT NULL,             -- 5(i) Competitors, differentiation and competitive advantage

    -- =========================================================================
    -- SECTION 6: TIME DURATION OF THE PROJECT COST DETAILS
    -- =========================================================================
    uploaded_project_milestones_timeline_path VARCHAR(255) NOT NULL, -- 6(a) Timeline showing the breakup of key milestones

    -- =========================================================================
    -- SECTION 7: ADDITIONAL DETAILS/DOCUMENTS NEEDED FROM START-UPS
    -- =========================================================================
    startup_sector_domain VARCHAR(255) NULL,                         -- 7(a) Briefly describe sector on which your idea/startup belong to
    startup_idea_reason_and_user_need TEXT NULL,                     -- 7(b) Why choose this idea? Need addressing for end user
    uploaded_startup_composition_registration_path VARCHAR(255) NULL, -- 7(c) Details about composition of Startup (Upload Registration docs)
    uploaded_founders_ceo_techhead_cv_credentials_path VARCHAR(255) NULL, -- 7(d) Credentials: CV, affiliations and professional credentials

    -- =========================================================================
    -- SECTION 8: DETAILED PRESENTATION & DECLARATION
    -- =========================================================================
    uploaded_detailed_pitch_deck_presentation_path VARCHAR(255) NOT NULL, -- 8. Prepare a detailed presentation and upload the same
    applicant_confirm_and_submit_declaration TINYINT(1) NOT NULL,    -- Declaration: Confirm and submit check (1 = Ticked)

    -- --- SYSTEM METRICS ---
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  
  DESC dmrc_all_sections_form;
  SELECT * FROM dmrc_all_sections_form;
  
  
  
  
  
  
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SELECT * FROM users;


CREATE TABLE IF NOT EXISTS portal_sub_admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SELECT * FROM  portal_sub_admins;
  



