// Service prices
const servicePrices = {
    "Gas Charging": 800,
    "Deep Cleaning": 1200,
    "Installation": 1500,
    "Compressor Replacement": 3000,
    "Leak Detection & Repair": 1000,
    "Cooling System Repair": 1500,
    "Defrost & Ice Removal": 1000,
    "Thermostat & Sensor Replacement": 1200,
    "Door Seal & Leak Fix": 800,
    "Motor & Drum Repair": 2000,
    "Full Maintenance": 1000,
    "Spin Cycle Troubleshooting": 1200,
    "Water Inlet/Drain Repair": 800,
    "Control Panel & Sensor Fix": 1500
};

// Function to update price display
function updatePriceDisplay(selectElement, priceElementId) {
    const selectedService = selectElement.value;
    const price = servicePrices[selectedService] || 0;
    document.getElementById(priceElementId).textContent = `₹${price}`;
}

// Function to update comprehensive total estimation
function updateTotalEstimation() {
    const checkboxes = document.querySelectorAll('input[name="service"]:checked');
    let serviceCharges = 0;
    const selectedServices = [];

    // Calculate service charges
    checkboxes.forEach(checkbox => {
        const price = parseInt(checkbox.getAttribute('data-price')) || 0;
        serviceCharges += price;
        selectedServices.push(checkbox.value);
    });

    // Fixed travel/service fee
    const travelFee = 200;

    // Calculate GST (18% on service charges + travel fee)
    const subtotal = serviceCharges + travelFee;
    const gstRate = 0.18;
    const gstAmount = Math.round(subtotal * gstRate);

    // Check for urgency fee
    const urgencyCheckbox = document.getElementById('urgencyService');
    const urgencyFee = urgencyCheckbox && urgencyCheckbox.checked ? 300 : 0;

    // Calculate final total
    const totalEstimation = subtotal + gstAmount + urgencyFee;

    // Update display elements
    document.getElementById('serviceCharges').textContent = `₹${serviceCharges}`;
    document.getElementById('travelFee').textContent = `₹${travelFee}`;
    document.getElementById('gstAmount').textContent = `₹${gstAmount}`;
    document.getElementById('totalEstimation').textContent = `₹${totalEstimation}`;

    return {
        serviceCharges,
        travelFee,
        gstAmount,
        urgencyFee,
        totalEstimation,
        selectedServices
    };
}

// Initialize page state
document.addEventListener('DOMContentLoaded', function() {
    // Ensure categories are visible and service grids are hidden on page load
    const categories = document.querySelector('.service-categories');
    const grids = document.querySelectorAll('.service-grid');

    if (categories) {
        categories.style.display = 'grid';
    }

    grids.forEach(grid => {
        grid.classList.remove('active');
    });

    // Auto-fill user details for faster booking
    const storedUser = JSON.parse(localStorage.getItem('smartCareUser') || 'null');
    if (storedUser) {
        const fields = [
            ['sectionName', 'name'],
            ['sectionPhone', 'phone'],
            ['sectionAddress', 'address'],
            ['custName', 'name'],
            ['custPhone', 'phone'],
            ['custAddress', 'address'],
            ['custEmail', 'email'],
            ['inlineName', 'name'],
            ['inlinePhone', 'phone'],
            ['inlineAddress', 'address']
        ];

        fields.forEach(([elementId, userKey]) => {
            const el = document.getElementById(elementId);
            if (el && storedUser[userKey]) {
                el.value = storedUser[userKey];
            }
        });
    }

    // Add price update listeners
    const inlineServiceDetail = document.getElementById('inlineServiceDetail');
    if (inlineServiceDetail) {
        inlineServiceDetail.addEventListener('change', () => updatePriceDisplay(inlineServiceDetail, 'inlinePrice'));
    }
    const sectionServiceDetail = document.getElementById('serviceDetail');
    if (sectionServiceDetail) {
        sectionServiceDetail.addEventListener('change', () => updatePriceDisplay(sectionServiceDetail, 'sectionPrice'));
    }

    // Add checkbox event listeners for multiple service selection
    const serviceCheckboxes = document.querySelectorAll('input[name="service"]');
    serviceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateTotalEstimation);
    });

    // Add urgency checkbox event listener
    const urgencyCheckbox = document.getElementById('urgencyService');
    if (urgencyCheckbox) {
        urgencyCheckbox.addEventListener('change', updateTotalEstimation);
    }

    // Initialize auth
    updateNavAuth();
    showAuthLogin();
});
function showServiceDetails(serviceType) {
    const grids = document.querySelectorAll('.service-grid');
    const categories = document.querySelector('.service-categories');

    // Hide categories and show service details
    categories.style.display = 'none';
    grids.forEach(g => g.classList.remove('active'));
    document.getElementById(serviceType).classList.add('active');

    // Smooth scroll to the service details
    document.getElementById(serviceType).scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function showCategories() {
    const grids = document.querySelectorAll('.service-grid');
    const categories = document.querySelector('.service-categories');

    // Hide service details and show categories
    grids.forEach(g => g.classList.remove('active'));
    categories.style.display = 'grid';

    // Scroll back to categories
    categories.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Smooth Scroll to Sections
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function scrollToBooking() {
    scrollToSection('booking');
}

function scrollToAuth() {
    scrollToSection('auth');
}

function openQuickBooking(serviceName, serviceDetail) {
    const user = JSON.parse(localStorage.getItem('smartCareUser') || 'null');
    if (!user) {
        showNotification("Please login first to book a service.", "warning");
        openAuthModal();
        return;
    }
    const inlineBooking = document.getElementById('inlineBooking');
    if (inlineBooking) {
        inlineBooking.style.display = 'block';
        inlineBooking.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const serviceSelect = document.getElementById('inlineServiceType');
    if (serviceSelect) {
        serviceSelect.value = serviceName;
    }

    const detailSelect = document.getElementById('inlineServiceDetail');
    if (detailSelect && serviceDetail) {
        detailSelect.value = serviceDetail;
        updatePriceDisplay(detailSelect, 'inlinePrice');
    }

    const inlineName = document.getElementById('inlineName');
    if (inlineName) {
        inlineName.focus();
    }
}

function hideInlineBooking() {
    const inlineBooking = document.getElementById('inlineBooking');
    if (inlineBooking) {
        inlineBooking.style.display = 'none';
    }
}

// Enhanced Booking Modal Logic
const modal = document.getElementById('bookingModal');
const authModal = document.getElementById('authModal');

function initBooking(serviceName) {
    const user = getCurrentUser();
    if (!user) {
        showNotification("Please login first to book a service.", "warning");
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('modalTitle').innerText = `Book ${serviceName}`;
    const modalServiceType = document.getElementById('modalServiceType');
    if (modalServiceType) {
        modalServiceType.value = serviceName;
    }
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scroll
}

function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scroll
}

function openAuthModal() {
    authModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
    authModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signUpForm').style.display = 'none';
    document.querySelectorAll('.auth-tab')[0].classList.add('active');
    document.querySelectorAll('.auth-tab')[1].classList.remove('active');
}

function toggleAuthForm(serviceId) {
    const authDiv = document.getElementById(`${serviceId}-auth`);
    if (authDiv) {
        authDiv.style.display = authDiv.style.display === 'none' ? 'block' : 'none';
    }
}

function toggleServiceBooking(serviceId) {
    const bookingDiv = document.getElementById(`${serviceId}-booking`);
    if (bookingDiv) {
        bookingDiv.style.display = bookingDiv.style.display === 'none' ? 'block' : 'none';
    }
}

function closeServiceBooking(serviceId) {
    const bookingDiv = document.getElementById(`${serviceId}-booking`);
    if (bookingDiv) {
        bookingDiv.style.display = 'none';
    }
}

function saveBooking(formData) {
    const bookings = JSON.parse(localStorage.getItem('smartCareBookings') || '[]');
    bookings.push({
        ...formData,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('smartCareBookings', JSON.stringify(bookings));

    // Save user details for faster future booking
    localStorage.setItem('smartCareUser', JSON.stringify({
        name: formData.name,
        phone: formData.phone,
        address: formData.address
    }));
}

function getSelectedServices(serviceId) {
    const checkboxes = document.querySelectorAll(`#${serviceId}-booking input[type="checkbox"]:checked`);
    const selectedServices = [];
    
    checkboxes.forEach(checkbox => {
        selectedServices.push({
            name: checkbox.value,
            price: parseInt(checkbox.getAttribute('data-price')) || 0
        });
    });
    
    return selectedServices;
}

function updateServiceSelection(serviceId) {
    const checkboxes = document.querySelectorAll(`#${serviceId}-booking input[type="checkbox"]`);
    const selectedServicesSpan = document.getElementById(`${serviceId}-selectedServices`);
    const totalPriceSpan = document.getElementById(`${serviceId}-totalPrice`);
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const selectedServices = getSelectedServices(serviceId);
            const serviceNames = selectedServices.map(s => s.name);
            const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
            
            selectedServicesSpan.textContent = serviceNames.length > 0 ? serviceNames.join(', ') : 'None';
            totalPriceSpan.textContent = totalPrice;
        });
    });
}

function showLoginForm(serviceId) {
    document.getElementById(`${serviceId}-login`).style.display = 'block';
    document.getElementById(`${serviceId}-signup`).style.display = 'none';
    document.querySelectorAll(`#${serviceId}-auth .auth-tab`)[0].classList.add('active');
    document.querySelectorAll(`#${serviceId}-auth .auth-tab`)[1].classList.remove('active');
}

function showSignUpForm(serviceId) {
    document.getElementById(`${serviceId}-login`).style.display = 'none';
    document.getElementById(`${serviceId}-signup`).style.display = 'block';
    document.querySelectorAll(`#${serviceId}-auth .auth-tab`)[0].classList.remove('active');
    document.querySelectorAll(`#${serviceId}-auth .auth-tab`)[1].classList.add('active');
}

function showAuthLogin() {
    document.getElementById('authLoginForm').style.display = 'block';
    document.getElementById('authSignUpForm').style.display = 'none';
    document.querySelectorAll('.auth-content .auth-tab')[0].classList.add('active');
    document.querySelectorAll('.auth-content .auth-tab')[1].classList.remove('active');
}

function showAuthSignUp() {
    document.getElementById('authLoginForm').style.display = 'none';
    document.getElementById('authSignUpForm').style.display = 'block';
    document.querySelectorAll('.auth-content .auth-tab')[0].classList.remove('active');
    document.querySelectorAll('.auth-content .auth-tab')[1].classList.add('active');
}

function scrollToAuth() {
    scrollToSection('auth');
    showAuthLogin();
}

function scrollToAuthSignUp() {
    scrollToSection('auth');
    showAuthSignUp();
}

function toggleLoginDropdown() {
    const loginDropdown = document.getElementById('loginDropdown');
    const signUpDropdown = document.getElementById('signUpDropdown');
    
    // Close signup dropdown if open
    if (signUpDropdown.classList.contains('active')) {
        signUpDropdown.classList.remove('active');
    }
    
    // Toggle login dropdown
    loginDropdown.classList.toggle('active');
}

function toggleSignUpDropdown() {
    const loginDropdown = document.getElementById('loginDropdown');
    const signUpDropdown = document.getElementById('signUpDropdown');
    
    // Close login dropdown if open
    if (loginDropdown.classList.contains('active')) {
        loginDropdown.classList.remove('active');
    }
    
    // Toggle signup dropdown
    signUpDropdown.classList.toggle('active');
}

function closeDropdowns() {
    document.getElementById('loginDropdown').classList.remove('active');
    document.getElementById('signUpDropdown').classList.remove('active');
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.auth-dropdown-container')) {
        closeDropdowns();
    }
});

// Auth Form Submissions
document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        const user = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || 'User',
            phone: data.user.user_metadata?.phone || ''
        };
        saveCurrentUser(user);
        showNotification("✅ Login successful! Welcome back.", "success");
        closeAuthModal();
        updateNavAuth();
    } catch (error) {
        showNotification(`❌ ${error.message}`, "error");
    }
});

document.getElementById('signUpFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signUpName').value;
    const email = document.getElementById('signUpEmail').value;
    const phone = document.getElementById('signUpPhone').value;
    const password = document.getElementById('signUpPassword').value;

    try {
        const { data, error } = await window.supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    phone
                }
            }
        });
        if (error) throw error;
        const user = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || name,
            phone: data.user.user_metadata?.phone || phone
        };
        saveCurrentUser(user);
        showNotification("✅ Account created successfully! Welcome to G care.", "success");
        closeAuthModal();
        updateNavAuth();
    } catch (error) {
        showNotification(`❌ ${error.message}`, "error");
    }
});

// Auth Section Form Submissions
const authLoginForm = document.getElementById('authLoginFormElement');
if (authLoginForm) {
    authLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('authLoginEmail').value;
        const password = document.getElementById('authLoginPassword').value;

        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            const user = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || 'User',
                phone: data.user.user_metadata?.phone || ''
            };
            saveCurrentUser(user);
            showNotification("✅ Login successful! Welcome back.", "success");
            document.getElementById('services').scrollIntoView({ behavior: 'smooth' });
            updateNavAuth();
        } catch (error) {
            showNotification(`❌ ${error.message}`, "error");
        }
    });
}

const authSignUpForm = document.getElementById('authSignUpFormElement');
if (authSignUpForm) {
    authSignUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('authSignUpName').value;
        const email = document.getElementById('authSignUpEmail').value;
        const phone = document.getElementById('authSignUpPhone').value;
        const password = document.getElementById('authSignUpPassword').value;

        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        phone
                    }
                }
            });
            if (error) throw error;
            const user = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || name,
                phone: data.user.user_metadata?.phone || phone
            };
            saveCurrentUser(user);
            showNotification("✅ Account created successfully! Welcome to G care.", "success");
            document.getElementById('services').scrollIntoView({ behavior: 'smooth' });
            updateNavAuth();
        } catch (error) {
            showNotification(`❌ ${error.message}`, "error");
        }
    });
}

// Nav Dropdown Form Submissions
const navLoginForm = document.getElementById('navLoginFormElement');
if (navLoginForm) {
    navLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('navLoginEmail').value;
        const password = document.getElementById('navLoginPassword').value;

        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            const user = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || 'User',
                phone: data.user.user_metadata?.phone || ''
            };
            saveCurrentUser(user);
            showNotification("✅ Login successful! Welcome back.", "success");
            closeDropdowns();
            updateNavAuth();
        } catch (error) {
            showNotification(`❌ ${error.message}`, "error");
        }
    });
}

const navSignUpForm = document.getElementById('navSignUpFormElement');
if (navSignUpForm) {
    navSignUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('navSignUpName').value;
        const email = document.getElementById('navSignUpEmail').value;
        const phone = document.getElementById('navSignUpPhone').value;
        const password = document.getElementById('navSignUpPassword').value;

        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        phone
                    }
                }
            });
            if (error) throw error;
            const user = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || name,
                phone: data.user.user_metadata?.phone || phone
            };
            saveCurrentUser(user);
            showNotification("✅ Account created successfully! Welcome to G care.", "success");
            closeDropdowns();
            updateNavAuth();
        } catch (error) {
            showNotification(`❌ ${error.message}`, "error");
        }
    });
}

function updateNavAuth() {
    const user = JSON.parse(localStorage.getItem('smartCareUser') || 'null');
    const navAuth = document.querySelector('.nav-auth');
    const loginButtons = document.querySelectorAll('.btn-login');

    if (!navAuth) {
        return;
    }

    const hasNavAnchors = navAuth.querySelector('.btn-login-nav') && navAuth.querySelector('.btn-signup-nav');

    if (user) {
        navAuth.innerHTML = `
            <span class="user-greeting">Hi, ${user.name.split(' ')[0]}</span>
            <button class="btn-logout-nav" onclick="logoutUser()">Logout</button>
        `;
        // Hide login buttons in services
        loginButtons.forEach(btn => btn.style.display = 'none');
        // Hide inline auth forms
        ['ac-auth', 'fridge-auth', 'wash-auth'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    } else if (hasNavAnchors) {
        // Keep existing login/signup anchor links when present
        loginButtons.forEach(btn => btn.style.display = 'inline-block');
        return;
    } else {
        navAuth.innerHTML = `
            <div class="auth-dropdown-container">
                <button class="btn-login-nav" onclick="toggleLoginDropdown()">Login</button>
                <div id="loginDropdown" class="auth-dropdown">
                    <div class="dropdown-header">
                        <h4>Login to Your Account</h4>
                        <span class="dropdown-close" onclick="closeDropdowns()">&times;</span>
                    </div>
                    <form id="navLoginFormElement" class="dropdown-form">
                        <div class="form-group">
                            <input type="email" id="navLoginEmail" placeholder="Email Address" required>
                        </div>
                        <div class="form-group">
                            <input type="password" id="navLoginPassword" placeholder="Password" required>
                        </div>
                        <button type="submit" class="btn-primary">Login</button>
                    </form>
                </div>
            </div>
            <div class="auth-dropdown-container">
                <button class="btn-signup-nav" onclick="toggleSignUpDropdown()">Sign Up</button>
                <div id="signUpDropdown" class="auth-dropdown">
                    <div class="dropdown-header">
                        <h4>Create Your Account</h4>
                        <span class="dropdown-close" onclick="closeDropdowns()">&times;</span>
                    </div>
                    <form id="navSignUpFormElement" class="dropdown-form">
                        <div class="form-group">
                            <input type="text" id="navSignUpName" placeholder="Full Name" required>
                        </div>
                        <div class="form-group">
                            <input type="email" id="navSignUpEmail" placeholder="Email Address" required>
                        </div>
                        <div class="form-group">
                            <input type="tel" id="navSignUpPhone" placeholder="Phone Number" required>
                        </div>
                        <div class="form-group">
                            <input type="password" id="navSignUpPassword" placeholder="Password" required>
                        </div>
                        <button type="submit" class="btn-primary">Sign Up</button>
                    </form>
                </div>
            </div>
        `;
        // Show login buttons in services
        loginButtons.forEach(btn => btn.style.display = 'inline-block');
        
        // Re-attach event listeners for nav forms
        attachNavFormListeners();
    }
}

function attachNavFormListeners() {
    // Nav Dropdown Form Submissions
    const navLoginForm = document.getElementById('navLoginFormElement');
    const navSignUpForm = document.getElementById('navSignUpFormElement');
    
    if (navLoginForm) {
        navLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('navLoginEmail').value;
            const password = document.getElementById('navLoginPassword').value;

            try {
                const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
                const user = {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata?.name || 'User',
                    phone: data.user.user_metadata?.phone || ''
                };
                saveCurrentUser(user);
                showNotification("✅ Login successful! Welcome back.", "success");
                closeDropdowns();
                updateNavAuth();
            } catch (error) {
                showNotification(`❌ ${error.message}`, "error");
            }
        });
    }
    
    if (navSignUpForm) {
        navSignUpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('navSignUpName').value;
            const email = document.getElementById('navSignUpEmail').value;
            const phone = document.getElementById('navSignUpPhone').value;
            const password = document.getElementById('navSignUpPassword').value;

            try {
                const { data, error } = await window.supabaseClient.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name,
                            phone
                        }
                    }
                });
                if (error) throw error;
                const user = {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata?.name || name,
                    phone: data.user.user_metadata?.phone || phone
                };
                saveCurrentUser(user);
                showNotification("✅ Account created successfully! Welcome to G care.", "success");
                closeDropdowns();
                updateNavAuth();
            } catch (error) {
                showNotification(`❌ ${error.message}`, "error");
            }
        });
    }
}

function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        window.supabaseClient.auth.signOut().catch(err => console.warn('Sign out error:', err));
        localStorage.removeItem('smartCareUser');
        updateNavAuth();
        showNotification("👋 Logged out successfully.", "info");
    }
}

// Enhanced Form Submission
const bookingModalForm = document.getElementById('bookingForm');
if (bookingModalForm) {
    bookingModalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.target.dataset.bookingHandled = 'true';

        const user = getCurrentUser();
        if (!user) {
            showNotification("❌ Please login first to book services.", "error");
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
            return;
        }

        const formData = {
            name: document.getElementById('custName').value,
            phone: document.getElementById('custPhone').value,
            email: document.getElementById('custEmail').value || user.email,
            address: document.getElementById('custAddress').value,
            date: document.getElementById('bookDate').value,
            time: document.getElementById('timeSlot').value,
            message: document.getElementById('custMessage').value,
            service: document.getElementById('modalServiceType') ? document.getElementById('modalServiceType').value : document.getElementById('modalTitle').innerText.replace('Book ', ''),
            timestamp: new Date().toISOString()
        };

        try {
            const { data, error } = await window.supabaseClient.from('bookings').insert({
                user_id: getCurrentUserId(user),
                email: user.email,
                name: formData.name,
                phone: formData.phone,
                services: [formData.service], // array for consistency
                date: formData.date,
                time: formData.time,
                address: formData.address,
                message: formData.message,
                amount: {
                    "AC Repair": 1500,
                    "Refrigerator Repair": 1200,
                    "Washing Machine Repair": 1000
                }[formData.service] || 1000
            });
            if (error) throw error;

            saveCurrentUser({
                name: formData.name,
                phone: formData.phone,
                email: user.email,
                address: formData.address
            });

            showNotification("✅ Booking confirmed! Redirecting to payment options...", "success");
            closeModal();

            const amount = {
                "AC Repair": 1500,
                "Refrigerator Repair": 1200,
                "Washing Machine Repair": 1000
            }[formData.service] || 1000;

            redirectToBookedPage(amount, `${formData.service} booking`, {
                service: formData.service,
                date: formData.date,
                time: formData.time,
                address: formData.address,
                message: formData.message
            });
            return;
        } catch (error) {
            showNotification(`❌ ${error.message}`, "error");
        }
    });
}

// In-page Booking Form Submission
const bookingSectionForm = document.getElementById('bookingSectionForm');
if (bookingSectionForm) {
    bookingSectionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.target.dataset.bookingHandled = 'true';

        const estimation = updateTotalEstimation();
        if (estimation.selectedServices.length === 0) {
            showNotification("❌ Please select at least one service.", "error");
            return;
        }

        const user = getCurrentUser();
        if (!user) {
            showNotification("❌ Please login first to book services.", "error");
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
            return;
        }

        const formData = {
            name: document.getElementById('sectionName').value,
            phone: document.getElementById('sectionPhone').value,
            services: estimation.selectedServices,
            amount: estimation.totalEstimation,
            date: document.getElementById('sectionDate').value,
            time: document.getElementById('sectionTime').value,
            address: document.getElementById('sectionAddress').value,
            message: document.getElementById('sectionMessage').value,
            isUrgent: document.getElementById('urgencyService').checked,
            timestamp: new Date().toISOString()
        };

        try {
            const { data, error } = await window.supabaseClient.from('bookings').insert({
                user_id: getCurrentUserId(user),
                email: user.email,
                name: formData.name,
                phone: formData.phone,
                services: formData.services,
                amount: formData.amount,
                date: formData.date,
                time: formData.time,
                address: formData.address,
                message: formData.message
            });
            if (error) throw error;

            saveCurrentUser({
                name: formData.name,
                phone: formData.phone,
                email: user.email,
                address: formData.address
            });

            const urgencyText = formData.isUrgent ? ' (Urgent)' : '';
            showNotification(`✅ Booking confirmed for ${estimation.selectedServices.length} service(s)${urgencyText}! Redirecting to payment options...`, "success");

            redirectToBookedPage(estimation.totalEstimation, `Service booking for ${estimation.selectedServices.join(', ')}`, {
                services: estimation.selectedServices,
                amount: estimation.totalEstimation,
                date: formData.date,
                time: formData.time,
                address: formData.address,
                message: formData.message,
                isUrgent: formData.isUrgent
            });
            return;
        } catch (error) {
            showNotification(`❌ ${error.message}`, "error");
        }
    });
}

// Inline Booking Form Submission
const inlineBookingForm = document.getElementById('inlineBookingForm');
if (inlineBookingForm) {
    inlineBookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.target.dataset.bookingHandled = 'true';

        const user = getCurrentUser();
        if (!user) {
            showNotification("❌ Please login first to book services.", "error");
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
            return;
        }

        const formData = {
            name: document.getElementById('inlineName').value,
            phone: document.getElementById('inlinePhone').value,
            service: document.getElementById('inlineServiceType').value,
            serviceDetail: document.getElementById('inlineServiceDetail').value,
            price: servicePrices[document.getElementById('inlineServiceDetail').value] || 0,
            date: document.getElementById('inlineDate').value,
            time: document.getElementById('inlineTime').value,
            address: document.getElementById('inlineAddress').value,
            message: document.getElementById('inlineMessage').value,
            timestamp: new Date().toISOString()
        };

        try {
            const { data, error } = await window.supabaseClient.from('bookings').insert({
                user_id: getCurrentUserId(user),
                email: user.email,
                name: formData.name,
                phone: formData.phone,
                services: [formData.serviceDetail], // array for consistency
                amount: formData.price,
                date: formData.date,
                time: formData.time,
                address: formData.address,
                message: formData.message
            });
            if (error) throw error;

            saveCurrentUser({
                name: formData.name,
                phone: formData.phone,
                email: user.email,
                address: formData.address
            });

            showNotification("✅ Booking confirmed! Redirecting to payment options...", "success");
            redirectToBookedPage(formData.price, `${formData.service} - ${formData.serviceDetail}`, {
                service: formData.service,
                serviceDetail: formData.serviceDetail,
                price: formData.price,
                date: formData.date,
                time: formData.time,
                address: formData.address,
                message: formData.message
            });
            return;
        } catch (error) {
            showNotification(`❌ ${error.message}`, "error");
        }
    });
}

// Inline Auth Form Submissions
['ac', 'fridge', 'wash'].forEach(serviceId => {
    // Login
    document.getElementById(`${serviceId}-loginForm`).addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById(`${serviceId}-loginEmail`).value;
        const password = document.getElementById(`${serviceId}-loginPassword`).value;

        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            const user = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || 'User',
                phone: data.user.user_metadata?.phone || ''
            };
            saveCurrentUser(user);
            showNotification("✅ Login successful! Welcome back.", "success");
            toggleAuthForm(serviceId);
            updateNavAuth();
        } catch (error) {
            showNotification(`❌ ${error.message}`, "error");
        }
    });

    // Sign Up
    document.getElementById(`${serviceId}-signUpForm`).addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById(`${serviceId}-signUpName`).value;
        const email = document.getElementById(`${serviceId}-signUpEmail`).value;
        const phone = document.getElementById(`${serviceId}-signUpPhone`).value;
        const password = document.getElementById(`${serviceId}-signUpPassword`).value;

        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        phone
                    }
                }
            });
            if (error) throw error;
            const user = {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || name,
                phone: data.user.user_metadata?.phone || phone
            };
            saveCurrentUser(user);
            showNotification("✅ Account created successfully! Welcome to G care.", "success");
            toggleAuthForm(serviceId);
            updateNavAuth();
        } catch (error) {
            showNotification(`❌ ${error.message}`, "error");
        }
    });
});

function attachServiceBookingHandlers() {
    const serviceMap = {
        ac: 'AC Repair',
        fridge: 'Refrigerator Repair',
        wash: 'Washing Machine Repair'
    };

    Object.entries(serviceMap).forEach(([serviceId, serviceName]) => {
        const form = document.getElementById(`${serviceId}-bookingForm`);
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.target.dataset.bookingHandled = 'true';

            const user = getCurrentUser();
            if (!user) {
                showNotification("❌ Please login first to book services.", "error");
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
                return;
            }

            const selectedServices = getSelectedServices(serviceId);
            if (selectedServices.length === 0) {
                showNotification("❌ Please select at least one service.", "error");
                return;
            }

            const amount = selectedServices.reduce((sum, item) => sum + item.price, 0);
            const formData = {
                email: user.email,
                name: document.getElementById(`${serviceId}-bookName`).value,
                phone: document.getElementById(`${serviceId}-bookPhone`).value,
                service: serviceName,
                services: selectedServices.map(item => item.name),
                amount,
                date: document.getElementById(`${serviceId}-bookDate`).value,
                time: document.getElementById(`${serviceId}-bookTime`).value,
                address: document.getElementById(`${serviceId}-bookAddress`).value,
                message: document.getElementById(`${serviceId}-bookMessage`).value
            };

            try {
                const { data, error } = await window.supabaseClient.from('bookings').insert({
                    user_id: getCurrentUserId(user),
                    email: user.email,
                    name: formData.name,
                    phone: formData.phone,
                    services: formData.services,
                    amount: formData.amount,
                    date: formData.date,
                    time: formData.time,
                    address: formData.address,
                    message: formData.message
                });
                if (error) throw error;

                saveCurrentUser({
                    name: formData.name,
                    phone: formData.phone,
                    email: user.email,
                    address: formData.address
                });

                showNotification(`✅ ${serviceName} booking confirmed! Redirecting to payment options...`, "success");
                closeServiceBooking(serviceId);
                redirectToBookedPage(amount, `${serviceName} booking`, {
                    service: serviceName,
                    services: selectedServices.map(item => item.name),
                    amount: amount,
                    date: document.getElementById(`${serviceId}-bookDate`).value,
                    time: document.getElementById(`${serviceId}-bookTime`).value,
                    address: document.getElementById(`${serviceId}-bookAddress`).value,
                    message: document.getElementById(`${serviceId}-bookMessage`).value
                });
                return;
            } catch (error) {
                showNotification(`❌ ${error.message}`, "error");
            }
        });
    });
}

attachServiceBookingHandlers();

// Fallback handler for any form posting to /api/bookings
document.addEventListener('submit', async (e) => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!form.action || !form.action.endsWith('/api/bookings')) return;
    if (form.dataset.bookingHandled === 'true') return;
    e.preventDefault();
    form.dataset.bookingHandled = 'true';

    const user = getCurrentUser();
    if (!user) {
        showNotification("❌ Please login first to book services.", "error");
        setTimeout(() => window.location.href = 'login.html', 1000);
        return;
    }

    const formData = {};
    Array.from(form.elements).forEach((el) => {
        if (!el.name && !el.id) return;
        if (el.disabled) return;

        const key = el.name || el.id;
        if (el.type === 'checkbox') {
            if (!el.checked) return;
            if (!el.name) {
                formData.services = formData.services || [];
                formData.services.push(el.value);
                return;
            }
            if (!formData[key]) formData[key] = [];
            formData[key].push(el.value);
            return;
        }

        if (el.type === 'radio') {
            if (!el.checked) return;
            formData[key] = el.value;
            return;
        }

        if (el.tagName === 'SELECT' && el.multiple) {
            formData[key] = Array.from(el.selectedOptions).map(o => o.value);
            return;
        }

        formData[key] = el.value;
    });

    if (!formData.email) {
        formData.email = user.email;
    }

    if (!formData.amount) {
        const amount = parseInt(formData.totalPrice || formData.price || formData.amount || 0, 10);
        if (amount > 0) formData.amount = amount;
    }
    if (!formData.service && formData.services && Array.isArray(formData.services)) {
        formData.service = formData.services.length === 1 ? formData.services[0] : 'Multiple Services';
    }

    try {
        const { data, error } = await window.supabaseClient.from('bookings').insert({
            user_id: getCurrentUserId(user),
            email: formData.email,
            name: formData.name,
            phone: formData.phone,
            services: formData.services || [formData.service],
            amount: formData.amount,
            date: formData.date,
            time: formData.time,
            address: formData.address,
            message: formData.message
        });
        if (error) throw error;
        showNotification('✅ Booking confirmed! Redirecting to booking confirmation...', 'success');

        const amount = Number(formData.amount) || 0;
        const bookingDescription = formData.service ? `${formData.service} booking` : 'Service booking';
        redirectToBookedPage(amount, bookingDescription, {
            service: formData.service,
            services: formData.services,
            date: formData.date,
            time: formData.time,
            address: formData.address,
            message: formData.message
        });
    } catch (error) {
        showNotification(`❌ ${error.message}`, 'error');
    }
});

// Contact Form Submission
const contactForm = document.querySelector('.contact-form form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showNotification("📧 Message sent successfully! We'll get back to you soon.", "success");
        e.target.reset();
    });
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-text">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

// Navbar Scroll Effect
let lastScrollTop = 0;
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scrolling down
        navbar.classList.add('scrolled');
    } else {
        // Scrolling up
        navbar.classList.remove('scrolled');
    }

    lastScrollTop = scrollTop;
});

function getApiBaseUrl() {
    const origin = window.location.origin;
    if (!origin || origin === 'null' || origin.startsWith('file://')) {
        return 'http://localhost:5000';
    }
    return origin;
}

function getApiUrl(path) {
    return new URL(path, getApiBaseUrl()).toString();
}

function postToApi(path, data) {
    return fetch(getApiUrl(path), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(async res => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(json.message || res.statusText || 'Request failed');
        }
        return json;
    }).catch(error => {
        const message = error.message.includes('Failed to fetch')
            ? 'Backend server unreachable. Start the Flask server and open the site from http://localhost:5000/'
            : error.message;
        throw new Error(message);
    });
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('smartCareUser') || 'null');
}

function getCurrentUserId(user) {
    return user && user.id ? user.id : null;
}

function saveCurrentUser(user) {
    localStorage.setItem('smartCareUser', JSON.stringify(user));
}

function savePendingBooking(bookingData) {
    localStorage.setItem('smartCarePendingBooking', JSON.stringify(bookingData));
}

function clearPendingBooking() {
    localStorage.removeItem('smartCarePendingBooking');
}

function redirectToBookedPage(amount, description, bookingDetails) {
    savePendingBooking({
        amount,
        description,
        bookingDetails
    });
    window.location.href = 'booked.html';
}

// Smooth Scroll for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Razorpay Payment Integration
function initRazorpayPayment(amount, description = 'Service Payment') {
    const user = JSON.parse(localStorage.getItem('smartCareUser') || 'null');
    if (!user) {
        showNotification("❌ Please login first to make a payment.", "error");
        openAuthModal();
        return;
    }

    // Show payment modal
    showPaymentModal(amount, description);
}

function showPaymentModal(amount, description, bookingDetails = null) {
    // Remove existing modal
    const existingModal = document.querySelector('.razorpay-payment-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'razorpay-payment-modal';
    modal.innerHTML = `
        <div class="razorpay-payment-container">
            <div class="payment-header">
                <h3>Complete Your Payment</h3>
                <span class="payment-close" onclick="closePaymentModal()">&times;</span>
            </div>

            ${bookingDetails ? `
            <div class="booking-summary">
                <h4>Booking Summary</h4>
                <div class="summary-details">
                    <div class="summary-row">
                        <span class="summary-label">Service:</span>
                        <span class="summary-value">${bookingDetails.service || description}</span>
                    </div>
                    ${bookingDetails.services ? `
                    <div class="summary-row">
                        <span class="summary-label">Selected Services:</span>
                        <span class="summary-value">${Array.isArray(bookingDetails.services) ? bookingDetails.services.join(', ') : bookingDetails.services}</span>
                    </div>
                    ` : ''}
                    <div class="summary-row">
                        <span class="summary-label">Date:</span>
                        <span class="summary-value">${bookingDetails.date || 'As scheduled'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Time:</span>
                        <span class="summary-value">${bookingDetails.time || 'As scheduled'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Address:</span>
                        <span class="summary-value">${bookingDetails.address || 'As provided'}</span>
                    </div>
                </div>
            </div>
            ` : ''}

            <div class="payment-amount">
                <div class="amount-display">
                    <span class="amount-label">Total Amount:</span>
                    <span class="amount-value">₹${amount}</span>
                </div>
                <p class="payment-description">${description}</p>
            </div>

            <div class="payment-actions">
                <button class="btn-razorpay" onclick="processRazorpayPayment(${amount}, '${description}', ${bookingDetails ? JSON.stringify(bookingDetails).replace(/"/g, '&quot;') : 'null'})">
                    Pay Now ₹${amount}
                </button>
                <button class="btn-secondary" onclick="closePaymentModal()" style="margin-top: 1rem; width: 100%;">
                    Cancel Payment
                </button>
            </div>

            <div class="payment-info">
                <small>
                    <strong>Secure Payment:</strong> Your payment is processed securely through Razorpay.
                    You will receive a confirmation email once the payment is completed.
                </small>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function closePaymentModal() {
    const modal = document.querySelector('.razorpay-payment-modal');
    if (modal) {
        modal.remove();
    }
}

let bookingRecognition = null;
let bookingListening = false;

function toggleBookingVoiceControl() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showNotification("❌ Voice booking control not supported in this browser.", "error");
        return;
    }

    if (bookingListening) {
        stopBookingVoiceControl();
    } else {
        startBookingVoiceControl();
    }
}

function startBookingVoiceControl() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    bookingRecognition = new SpeechRecognition();
    bookingRecognition.continuous = false;
    bookingRecognition.interimResults = false;
    bookingRecognition.lang = 'en-US';

    bookingRecognition.onstart = function() {
        bookingListening = true;
        const btn = document.getElementById('bookingVoiceBtn');
        if (btn) btn.classList.add('listening');
        document.getElementById('bookingVoiceIcon').textContent = '🎙️';
        document.getElementById('bookingVoiceText').textContent = 'Listening...';
        showNotification("🎤 Booking voice control activated. Say 'book now', 'fill name', or 'add gas charging'", "info");
    };

    bookingRecognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript.toLowerCase();
        processBookingVoiceCommand(transcript);
    };

    bookingRecognition.onend = function() {
        stopBookingVoiceControl();
    };

    bookingRecognition.onerror = function(event) {
        showNotification("❌ Voice recognition error: " + event.error, "error");
        stopBookingVoiceControl();
    };

    bookingRecognition.start();
}

function stopBookingVoiceControl() {
    if (bookingRecognition) {
        bookingRecognition.stop();
    }
    bookingListening = false;
    const btn = document.getElementById('bookingVoiceBtn');
    if (btn) btn.classList.remove('listening');
    document.getElementById('bookingVoiceIcon').textContent = '🎤';
    document.getElementById('bookingVoiceText').textContent = 'Booking Voice';
}

function processBookingVoiceCommand(command) {
    if (command.includes('book now') || command.includes('submit booking')) {
        const bookingForm = document.getElementById('bookingSectionForm');
        if (bookingForm) {
            bookingForm.requestSubmit();
            return;
        }
    }

    if (command.includes('fill name')) {
        const field = document.getElementById('sectionName');
        if (field) field.focus();
        showNotification("📝 Name field focused.", "info");
        return;
    }

    if (command.includes('fill phone')) {
        const field = document.getElementById('sectionPhone');
        if (field) field.focus();
        showNotification("📞 Phone field focused.", "info");
        return;
    }

    if (command.includes('fill address')) {
        const field = document.getElementById('sectionAddress');
        if (field) field.focus();
        showNotification("📍 Address field focused.", "info");
        return;
    }

    if (command.includes('fill date')) {
        const field = document.getElementById('sectionDate');
        if (field) field.focus();
        showNotification("📅 Date field focused.", "info");
        return;
    }

    if (command.includes('fill time') || command.includes('select time')) {
        const field = document.getElementById('sectionTime');
        if (field) field.focus();
        showNotification("⏰ Time slot field focused.", "info");
        return;
    }

    const serviceMap = {
        'gas charging': 'Gas Charging',
        'deep cleaning': 'Deep Cleaning',
        'installation': 'Installation',
        'compressor replacement': 'Compressor Replacement',
        'leak detection': 'Leak Detection & Repair',
        'cooling system repair': 'Cooling System Repair',
        'defrost and ice removal': 'Defrost & Ice Removal',
        'thermostat replacement': 'Thermostat & Sensor Replacement',
        'door seal': 'Door Seal & Leak Fix',
        'motor repair': 'Motor & Drum Repair',
        'full maintenance': 'Full Maintenance',
        'spin cycle': 'Spin Cycle Troubleshooting',
        'water inlet': 'Water Inlet/Drain Repair',
        'control panel': 'Control Panel & Sensor Fix'
    };

    for (const phrase in serviceMap) {
        if (command.includes(phrase)) {
            const checkbox = Array.from(document.querySelectorAll('#bookingSectionForm input[name="service"]')).find(el => el.value === serviceMap[phrase]);
            if (checkbox) {
                checkbox.checked = true;
                updateTotalEstimation();
                showNotification(`✅ Selected ${serviceMap[phrase]}.`, "success");
                return;
            }
        }
    }

    showNotification("❓ Command not recognized. Try 'book now', 'fill name', or 'add gas charging'.", "warning");
}

function processRazorpayPayment(amount, description, bookingDetails = null) {
    const user = JSON.parse(localStorage.getItem('smartCareUser') || 'null');

    // Razorpay options
    const options = {
        key: 'YOUR_RAZORPAY_KEY_ID', // Replace with your Razorpay Key ID
        amount: amount * 100, // Amount in paisa
        currency: 'INR',
        name: 'G care',
        description: description,
        image: 'https://example.com/logo.png', // Replace with your logo URL
        handler: async function (response) {
            // Payment success callback
            showNotification("✅ Payment successful! Payment ID: " + response.razorpay_payment_id, "success");
            closePaymentModal();

            // Store payment record locally
            const payments = JSON.parse(localStorage.getItem('smartCarePayments') || '[]');
            payments.push({
                paymentId: response.razorpay_payment_id,
                amount: amount,
                description: description,
                bookingDetails: bookingDetails,
                user: user.email,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('smartCarePayments', JSON.stringify(payments));

            // Record payment on backend as well
            const { data: paymentData, error: paymentError } = await window.supabaseClient.from('payments').insert({
                user_id: getCurrentUserId(user),
                email: user.email,
                amount: amount,
                description: description,
                payment_method: 'online',
                payment_status: 'completed',
                razorpay_payment_id: response.razorpay_payment_id
            });
            if (paymentError) {
                console.warn('Could not record payment on backend:', paymentError.message);
            }

            // Show success page
            showPaymentSuccessPage(response.razorpay_payment_id, amount, description, bookingDetails);
        },
        prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone
        },
        theme: {
            color: '#6366f1'
        },
        modal: {
            ondismiss: function() {
                showNotification("⚠️ Payment cancelled.", "warning");
            }
        }
    };

    // For demo purposes, simulate payment success
    showNotification("🔄 Processing payment...", "info");
    setTimeout(() => {
        const mockResponse = {
            razorpay_payment_id: 'pay_mock_' + Date.now()
        };
        options.handler(mockResponse);
    }, 2000);

    // Uncomment below for actual Razorpay integration
    // const rzp = new Razorpay(options);
    // rzp.open();
}

function showPaymentSuccessPage(paymentId, amount, description, bookingDetails) {
    // Remove existing modal
    const existingModal = document.querySelector('.razorpay-payment-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create success page modal
    const modal = document.createElement('div');
    modal.className = 'razorpay-payment-modal';
    modal.innerHTML = `
        <div class="razorpay-payment-container success-page">
            <div class="success-header">
                <div class="success-icon">✅</div>
                <h3>Payment Successful!</h3>
                <p>Your booking has been confirmed</p>
            </div>

            <div class="payment-details">
                <div class="detail-row">
                    <span class="detail-label">Payment ID:</span>
                    <span class="detail-value">${paymentId}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Amount Paid:</span>
                    <span class="detail-value">₹${amount}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Service:</span>
                    <span class="detail-value">${description}</span>
                </div>
            </div>

            ${bookingDetails ? `
            <div class="booking-confirmation">
                <h4>Booking Details</h4>
                <div class="confirmation-details">
                    ${bookingDetails.service ? `<p><strong>Service:</strong> ${bookingDetails.service}</p>` : ''}
                    ${bookingDetails.services ? `<p><strong>Selected Services:</strong> ${Array.isArray(bookingDetails.services) ? bookingDetails.services.join(', ') : bookingDetails.services}</p>` : ''}
                    ${bookingDetails.date ? `<p><strong>Scheduled Date:</strong> ${bookingDetails.date}</p>` : ''}
                    ${bookingDetails.time ? `<p><strong>Time Slot:</strong> ${bookingDetails.time}</p>` : ''}
                    ${bookingDetails.address ? `<p><strong>Address:</strong> ${bookingDetails.address}</p>` : ''}
                    ${bookingDetails.message ? `<p><strong>Notes:</strong> ${bookingDetails.message}</p>` : ''}
                </div>
            </div>
            ` : ''}

            <div class="success-actions">
                <button class="btn-primary" onclick="closePaymentModal()">Continue</button>
                <p class="success-note">
                    A confirmation email has been sent to your registered email address.
                    Our technician will contact you within 24 hours to confirm the appointment.
                </p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Update nav links to point to auth pages
function updateNavLinks() {
    const loginBtn = document.querySelector('.btn-login-nav');
    const signupBtn = document.querySelector('.btn-signup-nav');

    if (loginBtn) {
        loginBtn.onclick = () => window.location.href = 'login.html';
    }
    if (signupBtn) {
        signupBtn.onclick = () => window.location.href = 'signup.html';
    }
}

// Call updateNavLinks on page load
document.addEventListener('DOMContentLoaded', function() {
    updateNavLinks();
});

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.service-card, .feature, .testimonial-card').forEach(el => {
    el.classList.add('fade-in-up');
    observer.observe(el);
});

// Close modal on outside click
window.onclick = (e) => {
    if (e.target == modal) {
        closeModal();
    }
    if (e.target == authModal) {
        closeAuthModal();
    }
};

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') {
        closeModal();
    }
    if (e.key === 'Escape' && authModal.style.display === 'block') {
        closeAuthModal();
    }
});

// Form Validation Enhancement
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = '#ef4444';
            isValid = false;
        } else {
            input.style.borderColor = 'var(--gray-200)';
        }
    });

    return isValid;
}

// Add validation to forms
document.getElementById('bookingForm').addEventListener('input', (e) => {
    if (e.target.hasAttribute('required') && e.target.value.trim()) {
        e.target.style.borderColor = 'var(--gray-200)';
    }
});

// Service Card Hover Effects
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-8px) scale(1.02)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
    });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Add loading animation to body
    document.body.classList.add('loaded');

    // Set minimum date for booking
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('bookDate').min = tomorrow.toISOString().split('T')[0];
    const sectionDate = document.getElementById('sectionDate');
    if (sectionDate) {
        sectionDate.min = tomorrow.toISOString().split('T')[0];
    }
    const inlineDate = document.getElementById('inlineDate');
    if (inlineDate) {
        inlineDate.min = tomorrow.toISOString().split('T')[0];
    }

    // Set minimum date for service booking forms
    const acBookDate = document.getElementById('ac-bookDate');
    if (acBookDate) {
        acBookDate.min = tomorrow.toISOString().split('T')[0];
    }
    const fridgeBookDate = document.getElementById('fridge-bookDate');
    if (fridgeBookDate) {
        fridgeBookDate.min = tomorrow.toISOString().split('T')[0];
    }
    const washBookDate = document.getElementById('wash-bookDate');
    if (washBookDate) {
        washBookDate.min = tomorrow.toISOString().split('T')[0];
    }

    // Initialize tooltips for service features
    document.querySelectorAll('.feature-tag').forEach(tag => {
        tag.title = tag.textContent;
    });

    // Service booking forms are handled by attachServiceBookingHandlers().
    updateServiceSelection('ac');
    updateServiceSelection('fridge');
    updateServiceSelection('wash');
});

// Performance optimization: Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounced scroll handler
window.addEventListener('scroll', debounce(() => {
    // Any scroll-based functionality can go here
}, 16)); // ~60fps

// Simple Login Simulation for Demo
document.getElementById('openAuth').addEventListener('click', () => {
    localStorage.setItem('smartCareUser', 'demo@user.com');
    document.getElementById('openAuth').innerText = "Account";
    alert("Logged in successfully!");
});