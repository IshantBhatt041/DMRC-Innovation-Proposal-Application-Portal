
//  TOAST NOTIFICATION ENGINE - Replaces native alert() popups
// Self-contained: injects its own CSS so it works on whichever page includes this file

(function injectToastStyles() {
    if (document.getElementById('toast-engine-styles')) return;
    const style = document.createElement('style');
    style.id = 'toast-engine-styles';
    style.textContent = `
        .toast-container {
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 12px;
            pointer-events: none;
        }
        .toast {
            min-width: 320px;
            max-width: 400px;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(30, 58, 138, 0.14), 0 2px 8px rgba(0, 0, 0, 0.06);
            padding: 16px 18px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            pointer-events: auto;
            border-left: 4px solid #1e3a8a;
            position: relative;
            overflow: hidden;
            transform: translateX(130%);
            opacity: 0;
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .toast.show { transform: translateX(0); opacity: 1; }
        .toast.hide { transform: translateX(130%); opacity: 0; }
        .toast-icon-wrap {
            width: 34px; height: 34px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; font-size: 15px;
            background: rgba(30, 58, 138, 0.08); color: #1e3a8a;
        }
        .toast-content { flex: 1; padding-top: 1px; }
        .toast-title { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
        .toast-message { font-size: 12.5px; color: #475569; line-height: 1.45; }
        .toast-close {
            cursor: pointer; color: #94a3b8; font-size: 13px; flex-shrink: 0;
            background: none; border: none; padding: 4px; border-radius: 50%;
            transition: all 0.15s ease;
        }
        .toast-close:hover { color: #1e293b; background: #f1f5f9; }
        .toast-progress {
            position: absolute; bottom: 0; left: 0; height: 3px; width: 100%;
            background: rgba(30, 58, 138, 0.3); transform-origin: left;
            animation: toast-shrink linear forwards;
        }
        @keyframes toast-shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }
        .toast.success { border-left-color: #16a34a; }
        .toast.success .toast-icon-wrap { background: rgba(22, 163, 74, 0.1); color: #16a34a; }
        .toast.success .toast-progress { background: rgba(22, 163, 74, 0.35); }
        .toast.error { border-left-color: #dc2626; }
        .toast.error .toast-icon-wrap { background: rgba(220, 38, 38, 0.1); color: #dc2626; }
        .toast.error .toast-progress { background: rgba(220, 38, 38, 0.35); }
        .toast.warning { border-left-color: #d97706; }
        .toast.warning .toast-icon-wrap { background: rgba(217, 119, 6, 0.1); color: #d97706; }
        .toast.warning .toast-progress { background: rgba(217, 119, 6, 0.35); }
        .toast.info { border-left-color: #1e3a8a; }
    `;
    document.head.appendChild(style);
})();

function showToast(message, type = 'info', title = null, duration = 4500) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    const titles = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Notice' };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon-wrap"><i class="fa-solid ${icons[type] || icons.info}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${title || titles[type] || titles.info}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button type="button" class="toast-close"><i class="fa-solid fa-xmark"></i></button>
        <div class="toast-progress" style="animation-duration:${duration}ms;"></div>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    const dismiss = () => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 350);
    };

    const timer = setTimeout(dismiss, duration);
    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(timer);
        dismiss();
    });
}

function toggleSection(secId) {
    for (let i = 1; i <= 8; i++) {
        const content = document.getElementById(`content-${i}`);
        const arrow = document.getElementById(`arrow-${i}`);
        const sideBtn = document.getElementById(`side-btn-${i}`);
        
        if (i === secId) {
            if (content) content.classList.remove('hidden-section');
            if (arrow) {
                arrow.classList.remove('fa-chevron-right');
                arrow.classList.add('fa-chevron-down');
            }
            if (sideBtn) sideBtn.classList.add('active');
        } else {
            if (content) content.classList.add('hidden-section');
            if (arrow) {
                arrow.classList.remove('fa-chevron-down');
                arrow.classList.add('fa-chevron-right');
            }
            if (sideBtn) sideBtn.classList.remove('active');
        }
    }

    setTimeout(() => {
        const activeContent = document.getElementById(`content-${secId}`);
        if (activeContent) {
            const parentSection = activeContent.closest('.form-section');
            if (parentSection) {
                const headerOffset = 95; 
                const elementPosition = parentSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }
    }, 150);
}

let founderCount = 1;

function renumberFounders() {
    const cards = document.querySelectorAll('#founders-container .founder-card');
    cards.forEach((card, index) => {
        const label = card.querySelector('.founder-card-title');
        if (label) label.textContent = 'Founder Member #' + (index + 1);
    });
}

function addFounderRow() {
    founderCount++;
    const container = document.getElementById('founders-container');
    if (!container) return;

    const id = founderCount;
    const rowHtml = `
        <div class="founder-card" id="founder-card-${id}" style="margin-top: 12px; border-top: 2px solid #1e3a8a;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span class="founder-card-title" style="margin-bottom:0;">Founder Member #${id}</span>
                <button type="button" onclick="removeFounderRow(${id})" title="Remove this founder"
                  style="width:26px; height:26px; border-radius:50%; background:transparent; border:1.5px solid #cbd5e1; color:#94a3b8; cursor:pointer; display:flex; align-items:center; justify-content:center; padding:0; flex-shrink:0; transition: all 0.15s;"
                  onmouseenter="this.style.background='#fee2e2'; this.style.borderColor='#fca5a5'; this.style.color='#dc2626';"
                  onmouseleave="this.style.background='transparent'; this.style.borderColor='#cbd5e1'; this.style.color='#94a3b8';">
                  <i class="fa-solid fa-xmark" style="font-size:13px; pointer-events:none;"></i>
                </button>
              </div>
            <div class="grid-3 gap-3">
                <div>
                    <label class="field-label">Name of the founder <span class="required-star">*</span></label>
                    <input type="text" required name="founder_name_${id}" placeholder="Enter name of founder" class="form-input bg-white">
                </div>
                <div>
                    <label class="field-label">Nationality <span class="required-star">*</span></label>
                    <input type="text" required name="founder_nationality_${id}" placeholder="Enter nationality" class="form-input bg-white">
                </div>
                <div>
                    <label class="field-label">Shareholding of each founder percentage <span class="required-star">*</span></label>
                    <div class="grid-2 gap-1">
                        <input type="number" required name="founder_share_${id}" placeholder="%" class="form-input bg-white">
                        <label class="upload-dashed-box bg-white">
                            <input type="file" required name="founder_share_doc_${id}" class="file-hidden" accept=".pdf,.jpg,.jpeg,.png">
                            <span class="upload-title-mini"><i class="fa-solid fa-cloud-arrow-up"></i> Upload</span>
                        </label>
                    </div>
                </div>
            </div>
            <div class="grid-3 gap-3 mt-2">
                <div>
                    <label class="field-label">LinkedIn profile/ URL/email id of founder <span class="required-star">*</span></label>
                    <input type="text" required name="founder_linkedin_${id}" placeholder="Enter URL/email details" class="form-input bg-white">
                </div>
                <div>
                    <label class="field-label">Mobile No <span class="required-star">*</span></label>
                    <input type="tel" required name="founder_mobile_${id}" placeholder="Enter contact mobile no" class="form-input bg-white">
                </div>
                <div>
                    <label class="field-label">Identity Proof of each Founder (Aadhar/ PAN/Voter ID Card) <span class="required-star">*</span></label>
                    <div class="grid-2 gap-1">
                        <input type="text" required name="founder_id_type_${id}" placeholder="Type" class="form-input bg-white">
                        <label class="upload-dashed-box bg-white">
                            <input type="file" required name="founder_id_doc_${id}" class="file-hidden" accept=".pdf,.jpg,.jpeg,.png">
                            <span class="upload-title-mini"><i class="fa-solid fa-cloud-arrow-up"></i> Upload</span>
                        </label>
                    </div>
                </div>
            </div>
            <div class="mt-2">
                <label class="field-label">Address of founder member <span class="required-star">*</span></label>
                <input type="text" required name="founder_address_${id}" placeholder="Enter continuous physical address layout" class="form-input bg-white">
            </div>
        </div>`;
    container.insertAdjacentHTML('beforeend', rowHtml);
    renumberFounders();
}

function removeFounderRow(id) {
    const card = document.getElementById('founder-card-' + id);
    if (card) {
        card.remove();
        renumberFounders();
    }
}

//  INTERCEPT ENGINE LOGIC: Target empty nodes inside hidden view layers cleanly
function executeNodalFormTransmission(event) {
    if (event) event.preventDefault();

    const form = document.getElementById("mainForm");
    const requiredFields = form.querySelectorAll("[required]");
    let firstInvalidField = null;
    let invalidSectionId = null;

    requiredFields.forEach(field => {
        let isFieldEmpty = false;
        if (field.type === "checkbox" && !field.checked) {
            isFieldEmpty = true;
        } else if (field.type === "radio") {
            const radioGroup = form.querySelectorAll(`input[name="${field.name}"]`);
            let isChecked = false;
            radioGroup.forEach(r => { if (r.checked) isChecked = true; });
            if (!isChecked) isFieldEmpty = true;
        } else if (field.type !== "checkbox" && field.type !== "radio" && !field.value.trim()) {
            isFieldEmpty = true;
        }

        if (isFieldEmpty && !firstInvalidField) {
            firstInvalidField = field;
            //  FIX: section detect karne ke liye .form-section dhoondo (content- wala div nahi),
            // taaki declaration-panel jaise bahar wale fields bhi sahi se handle ho jaayein
            // aur "hidden-section" check explicit ho, sirf id-prefix assume na ho.
            const closestSectionContent = field.closest('.accordion-content[id^="content-"]');
            if (closestSectionContent) {
                invalidSectionId = parseInt(closestSectionContent.id.replace('content-', ''), 10);
            } else {
                invalidSectionId = null; // field already form-section ke bahar hai (declaration panel), already visible
            }
        }
    });

    if (firstInvalidField) {
        if (invalidSectionId) {
            toggleSection(invalidSectionId);
        }

        setTimeout(() => {
            const hOffset = 120;
            const targetY = firstInvalidField.getBoundingClientRect().top + window.pageYOffset - hOffset;

            window.scrollTo({
                top: targetY,
                behavior: "smooth"
            });

            // file input jaisa invisible element directly reportValidity() se tooltip nahi dikha sakta
            // kyunki woh opacity:0 hai - is liye uske dashed box ko highlight bhi karte hain.
            firstInvalidField.reportValidity();

            const dashedBox = firstInvalidField.closest('.upload-dashed-box, .upload-dashed-box-small');
            if (dashedBox) {
                dashedBox.style.borderColor = '#ef4444';
                dashedBox.style.backgroundColor = '#fef2f2';
                setTimeout(() => {
                    dashedBox.style.borderColor = '';
                    dashedBox.style.backgroundColor = '';
                }, 2500);
            }
        }, 300);

        return false;
    }

    //  VALIDATION PASSED: DISPATCH PACKAGES ===
    const formDataPayload = new FormData();
    form.querySelectorAll("input, textarea, select").forEach((field) => {
        // Ab har field ke paas guaranteed name hai, isliye id/fallback ki zaroorat nahi
        if (!field.name) return;

        if (field.type === "file") {
            if (field.files.length > 0) formDataPayload.append(field.name, field.files[0]);
        } else if (field.type === "checkbox") {
            formDataPayload.append(field.name, field.checked);
        } else if (field.type === "radio") {
            if (field.checked) formDataPayload.append(field.name, field.value);
        } else {
            formDataPayload.append(field.name, field.value);
        }
    });

    // Submit button ko disable karke double-click se duplicate submission rokte hain
    const submitBtn = form.querySelector('.btn-submit');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.style.cursor = 'not-allowed';
    }

    fetch('http://localhost:5000/api/submit-form', {
        method: 'POST',
        body: formDataPayload
    })
    .then(response => {
        if (!response.ok) throw new Error("Architecture mismatch.");
        return response.json();
    })
    .then(data => {
        if (data.success) {
            form.reset();
            clearSavedDraft();
            // Force the bar back to 0% directly — after reset(), some <select>/radio
            // defaults can carry a non-empty value, which would otherwise make
            // updateFormProgress() miscount a freshly-cleared form as partially filled.
            const progressFillEl = document.getElementById('form-progress-bar-fill');
            const progressPctEl = document.getElementById('form-progress-percent');
            if (progressFillEl) progressFillEl.style.width = '0%';
            if (progressPctEl) progressPctEl.textContent = '0%';
            document.querySelectorAll('.upload-dashed-box, .upload-dashed-box-small').forEach(box => {
                const titleSpan = box.querySelector('.upload-title, .upload-title-mini, .upload-title-small');
                if (titleSpan) titleSpan.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Upload File`;
            });

            //  SUCCESS CONFIRMATION SCREEN — replaces the toast on a successful submit
            const extractedId = (data.message && data.message.match(/DMRC-[A-Z0-9]+/)) ? data.message.match(/DMRC-[A-Z0-9]+/)[0] : '';
            const idEl = document.getElementById('success-application-id');
            if (idEl && extractedId) idEl.textContent = extractedId;
            const successScreen = document.getElementById('submission-success-screen');
            if (successScreen) successScreen.classList.add('active');
        } else {
            showToast(data.message, "error", "Submission Failed", 7000);
        }
    })
    .catch(err => {
        console.error(err);
        showToast("Connection refused. Please verify if the local backend is alive on port 5000.", "error", null, 7000);
    })
    .finally(() => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '';
            submitBtn.style.cursor = '';
        }
    });

    return false;
}

//  VISUAL FEEDBACK: Selected file state tracker monitoring module
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("mainForm");
    if (form) {
        form.addEventListener("change", function (event) {
            if (event.target && event.target.type === "file") {
                const fileInput = event.target;
                const dashedBox = fileInput.closest('.upload-dashed-box, .upload-dashed-box-small');
                
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const fileName = file.name.toLowerCase();
                    const fileSizeInBytes = file.size;
                    const maxLimitInBytes = 2 * 1024 * 1024;

                    if (fileSizeInBytes > maxLimitInBytes) {
                        showToast("The uploaded document exceeds the maximum permissible limit of 2MB.", "warning", "File Too Large");
                        fileInput.value = ""; 
                        return;
                    }

                    const allowedAcceptAttribute = fileInput.getAttribute("accept") || "";
                    if (allowedAcceptAttribute.includes(".ppt") || allowedAcceptAttribute.includes(".pptx")) {
                        if (!fileName.endsWith(".ppt") && !fileName.endsWith(".pptx") && !fileName.endsWith(".pdf")) {
                            showToast("Only Presentation Decks (.ppt, .pptx) or PDF format are accepted.", "warning", "Invalid Format");
                            fileInput.value = ""; 
                            return;
                        }
                    } else {
                        if (!fileName.endsWith(".pdf") && !fileName.endsWith(".jpg") && !fileName.endsWith(".jpeg") && !fileName.endsWith(".png")) {
                            showToast("Please upload a valid document format (PDF, JPG, or PNG).", "warning", "Invalid Format");
                            fileInput.value = ""; 
                            return;
                        }
                    }

                    // Render out the dynamic selected file label directly inside container layer
                    if (dashedBox) {
                        const labelSpan = dashedBox.querySelector('.upload-title, .upload-title-mini, .upload-title-small');
                        if (labelSpan) {
                            labelSpan.innerHTML = `<i class="fa-solid fa-file-circle-check" style="color:#16a34a;"></i> ${file.name.substring(0, 25)}${file.name.length > 25 ? '...' : ''}`;
                        }
                    }
                }
            }
        });
    }
});


     /*FORM PROGRESS BAR — tracks % of required fields filled (including file
    uploads). Radio buttons and same-name checkbox groups are counted as ONE
    logical field, not one per option.
     */
function updateFormProgress() {
    const form = document.getElementById("mainForm");
    const fillEl = document.getElementById("form-progress-bar-fill");
    const pctEl = document.getElementById("form-progress-percent");
    if (!form || !fillEl || !pctEl) return;

    const requiredFields = Array.from(form.querySelectorAll('[required]'));
    if (requiredFields.length === 0) return;

    const countedGroupNames = new Set();
    let totalRequired = 0;
    let filledCount = 0;
    const missingFields = []; // for debugFormProgress()

    requiredFields.forEach(field => {
        if (field.type === 'radio' || field.type === 'checkbox') {
            const groupKey = field.name || field.id;
            if (countedGroupNames.has(groupKey)) return; // already counted this group
            countedGroupNames.add(groupKey);
            totalRequired++;
            const groupChecked = form.querySelector(`[name="${CSS.escape(field.name)}"]:checked`);
            if (groupChecked) filledCount++;
            else missingFields.push(field.name || field.id);
        } else if (field.type === 'file') {
            totalRequired++;
            if (field.files && field.files.length > 0) filledCount++;
            else missingFields.push(field.name || field.id);
        } else {
            totalRequired++;
            if (field.value && field.value.trim() !== '') filledCount++;
            else missingFields.push(field.name || field.id);
        }
    });

    const percent = totalRequired === 0 ? 0 : Math.round((filledCount / totalRequired) * 100);
    fillEl.style.width = percent + '%';
    pctEl.textContent = percent + '%';

    //  Single consistent color for the bar — dark blue throughout, no matter the percentage
    fillEl.style.background = '#1e3a8a';

    window._formProgressMissingFields = missingFields; // used by debugFormProgress()
}

//  Call debugFormProgress() in the browser console to see exactly which
// required field names are still empty/unchecked/missing a file.
function debugFormProgress() {
    updateFormProgress();
    if (!window._formProgressMissingFields || window._formProgressMissingFields.length === 0) {
        console.log('%cAll required fields are filled!', 'color:green;font-weight:bold;');
    } else {
        console.log('%cStill missing these required fields:', 'color:red;font-weight:bold;', window._formProgressMissingFields);
    }
}


     /*DRAFT AUTO-SAVE — saves non-file field values to localStorage so the
    applicant doesn't lose progress if they close the tab mid-form. Files
    themselves cannot be restored (browser security), only text/select/
    checkbox values.*/
    
const DRAFT_STORAGE_KEY = 'dmrc_application_draft_v1';
let draftAutoSaveTimer = null;

function collectDraftData() {
    const form = document.getElementById("mainForm");
    if (!form) return {};
    const draft = {};
    Array.from(form.elements).forEach(el => {
        if (!el.name || el.type === 'file') return;
        if (el.type === 'checkbox' || el.type === 'radio') {
            draft[el.name] = el.checked;
        } else {
            draft[el.name] = el.value;
        }
    });
    return draft;
}

function scheduleDraftAutoSave() {
    clearTimeout(draftAutoSaveTimer);
    draftAutoSaveTimer = setTimeout(() => {
        try {
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(collectDraftData()));
        } catch (e) {
            console.error('Draft auto-save failed:', e);
        }
    }, 800); // debounce so we don't hammer localStorage on every keystroke
}

function saveDraftManually() {
    try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(collectDraftData()));
        showToast('Your progress has been saved as a draft.', 'success', 'Draft Saved');
    } catch (e) {
        console.error('Manual draft save failed:', e);
        showToast('Could not save draft. Storage may be full.', 'error');
    }
}

function restoreDraftIfPresent() {
    const form = document.getElementById("mainForm");
    if (!form) return;
    let saved;
    try {
        saved = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || 'null');
    } catch (e) {
        saved = null;
    }
    if (!saved) return;

    Object.keys(saved).forEach(name => {
        const els = form.querySelectorAll(`[name="${CSS.escape(name)}"]`);
        els.forEach(el => {
            if (el.type === 'checkbox' || el.type === 'radio') {
                el.checked = !!saved[name];
            } else {
                el.value = saved[name];
            }
        });
    });

    showToast('A saved draft was found and restored. You can continue where you left off.', 'info', 'Draft Restored');
    updateFormProgress();
}

function clearSavedDraft() {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
}

//  SUCCESS CONFIRMATION SCREEN — "Back to Form" button handler
function closeSuccessScreen() {
    const successScreen = document.getElementById('submission-success-screen');
    if (successScreen) successScreen.classList.remove('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


    /* CHATBOT FOR FAQ HELP — simple keyword-matched canned Q&A, no backend needed
     */
const FAQ_KNOWLEDGE_BASE = [
    { keywords: ['dpiit'], question: "What is DPIIT proof?", answer: "DPIIT proof is your Startup India recognition certificate issued by the Department for Promotion of Industry and Internal Trade. You can download it from the Startup India portal if you're a recognized startup." },
    { keywords: ['udyam', 'msme'], question: "What is Udyam / MSME registration?", answer: "Udyam Registration is the official MSME registration certificate issued by the Ministry of MSME, Government of India. Upload the certificate if your entity is MSME registered." },
    { keywords: ['application id', 'app id', 'track', 'status'], question: "How do I check my application status?", answer: "After submitting the form, you'll get an Application ID (e.g. DMRC-A1B2C3D4) by email. Go to the login page and click 'Check Application Status' to enter that ID and see your current status." },
    { keywords: ['entity type', 'company type'], question: "What is Entity Type?", answer: "Entity Type refers to your company's legal structure — e.g. Private Limited, Public Limited, LLP, Partnership, or Proprietorship. Select the one matching your incorporation documents." },
    { keywords: ['file size', 'upload limit', 'document size', 'photo', 'image', 'picture', 'scan', 'jpg', 'png', 'file format'], question: "What's the file upload limit?", answer: "Each uploaded document must be under 2MB, in PDF, JPG, or PNG format (presentation decks also accept PPT/PPTX)." },
    { keywords: ['draft', 'save progress'], question: "Can I save my progress and come back later?", answer: "Yes — your form auto-saves as a draft in your browser as you type. You can also click the 'Save Draft' button anytime. When you reopen the form, your saved answers will be restored automatically." },
    { keywords: ['founder', 'shareholding'], question: "What founder details do I need?", answer: "You need each founder's name, nationality, shareholding %, contact details, address, and identity proof. You can add up to multiple founders using the 'Add Founder' option." },
    { keywords: ['balance sheet', 'turnover'], question: "What financial documents are needed?", answer: "You need turnover figures and balance sheets for the last 3 financial years (2023-24, 2024-25, 2025-26)." },
];

function toggleFaqChatbot() {
    const panel = document.getElementById('faq-chatbot-panel');
    if (!panel) return;
    panel.classList.toggle('open');
    if (panel.classList.contains('open') && document.getElementById('faq-chatbot-messages').children.length === 0) {
        initFaqChatbot();
    }
}

function initFaqChatbot() {
    addFaqMessage("Hi! I'm the DMRC Help Assistant. Ask me anything about filling this form, or tap a quick question below.", 'bot');
    const quickWrap = document.getElementById('faq-chatbot-quick-questions');
    quickWrap.innerHTML = '';
    FAQ_KNOWLEDGE_BASE.slice(0, 4).forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'faq-quick-btn';
        btn.textContent = item.question;
        btn.onclick = () => askFaqBot(item.question);
        quickWrap.appendChild(btn);
    });
}

function addFaqMessage(text, sender) {
    const messagesBox = document.getElementById('faq-chatbot-messages');
    const msgEl = document.createElement('div');
    msgEl.className = `faq-msg ${sender}`;
    msgEl.textContent = text;
    messagesBox.appendChild(msgEl);
    messagesBox.scrollTop = messagesBox.scrollHeight;
}


  /*   DYNAMIC FORM-FIELD KNOWLEDGE BASE — scans the actual form DOM (every
    section + field label + upload requirement) so the chatbot can answer
    questions about ANY field in the form, not just the few hardcoded FAQs
    above. Built once and cached.
   */
const FAQ_STOPWORDS = new Set(['the','is','are','a','an','of','for','to','and','in','on','do','does','i','you','your','my','what','how','can','need','needs','required','please','detail','details','with','if','any','it','this','that','be','has','have','yes','no','or','as','about','tell','me','which','upload','uploading']);

function faqTokenize(text) {
    return (text || '')
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 3 && !FAQ_STOPWORDS.has(w));
}

function buildFormFieldIndex() {
    const index = [];
    document.querySelectorAll('.form-section').forEach(section => {
        const headerEl = section.querySelector('.section-header span');
        const sectionTitle = headerEl ? headerEl.textContent.trim() : '';
        section.querySelectorAll('.field-label').forEach(labelEl => {
            const labelText = labelEl.textContent.replace(/\*/g, '').trim();
            if (!labelText) return;
            const container = labelEl.closest('div') || labelEl.parentElement;
            const control = container ? container.querySelector('input, textarea, select') : null;
            index.push({
                label: labelText,
                section: sectionTitle,
                hint: control ? (control.getAttribute('placeholder') || '') : '',
                isFile: !!(control && control.type === 'file'),
                accept: control ? (control.getAttribute('accept') || '') : '',
                tokens: faqTokenize(labelText)
            });
        });
    });
    return index;
}

function getFormFieldIndex() {
    if (!window._formFieldIndex) window._formFieldIndex = buildFormFieldIndex();
    return window._formFieldIndex;
}

function findBestFieldMatch(query) {
    const qTokens = faqTokenize(query);
    if (qTokens.length === 0) return null;

    let best = null;
    let bestScore = 0;
    getFormFieldIndex().forEach(item => {
        let score = 0;
        qTokens.forEach(qt => {
            if (item.tokens.some(lt => lt === qt || lt.includes(qt) || qt.includes(lt))) score++;
        });
        if (score > bestScore) {
            bestScore = score;
            best = item;
        }
    });
    return bestScore > 0 ? best : null;
}

function describeFieldMatch(match) {
    let ans = `That's about: "${match.label}"`;
    if (match.section) ans += ` — under ${match.section}`;
    ans += `. This field is mandatory.`;
    if (match.isFile) {
        ans += ' You need to upload a document for this';
        if (match.accept) {
            const formats = match.accept.split(',').map(a => a.replace('.', '').toUpperCase()).join(', ');
            ans += ` (accepted formats: ${formats})`;
        }
        ans += ', and the file must be under 2MB.';
    } else if (match.hint) {
        ans += ` Example: "${match.hint}".`;
    }
    return ans;
}

function findFaqAnswer(query) {
    const lowerQuery = query.toLowerCase();

    // 1) Check the curated FAQ list first (exact/common questions)
    const match = FAQ_KNOWLEDGE_BASE.find(item => item.keywords.some(k => lowerQuery.includes(k)));
    if (match) return match.answer;

    // 2) Fall back to matching against the real fields present in the form,
    //    so questions about ANY section/upload/field get a relevant answer
    //    instead of a generic "I don't know".
    const fieldMatch = findBestFieldMatch(query);
    if (fieldMatch) return describeFieldMatch(fieldMatch);

    return "I don't have a specific answer for that yet. Please check the field's placeholder text for guidance, or contact the DMRC Innovation Cell for further help.";
}

function askFaqBot(question) {
    addFaqMessage(question, 'user');
    setTimeout(() => addFaqMessage(findFaqAnswer(question), 'bot'), 300);
}

function handleFaqChatbotSubmit(event) {
    event.preventDefault();
    const input = document.getElementById('faq-chatbot-input');
    const query = input.value.trim();
    if (!query) return false;
    askFaqBot(query);
    input.value = '';
    return false;
}

/*
     WIRE UP: progress bar + draft auto-save on form load/change, and clear
    draft after a successful submission (hooked from executeNodalFormTransmission's
    success branch via a custom event so we don't duplicate submit logic).
    */
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("mainForm");
    if (!form) return;

    restoreDraftIfPresent();
    updateFormProgress();

    form.addEventListener("input", () => { updateFormProgress(); scheduleDraftAutoSave(); });
    form.addEventListener("change", () => { updateFormProgress(); scheduleDraftAutoSave(); });

    //  EXTRA SAFETY NET — runs in the capture phase, before the inline
    // onsubmit="" handler even fires. Guarantees the browser NEVER does a
    // native page navigation/reload on submit, no matter what happens
    // later in executeNodalFormTransmission().
    form.addEventListener("submit", function (e) {
        e.preventDefault();
    }, true);
});
