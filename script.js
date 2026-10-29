const STORAGE_KEYS = {
  users: "real_alpha_users",
  applications: "real_alpha_applications"
};

const defaultAdmin = {
  email: "admin@alphaloan.co.ke",
  password: "admin123",
  role: "admin"
};

function seedDefaultData() {
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || "[]");
  if (!users.length) {
    users.push(defaultAdmin);
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  }

  const applications = JSON.parse(localStorage.getItem(STORAGE_KEYS.applications) || "[]");
  if (!applications.length) {
    applications.push({
      id: Date.now(),
      fullName: "Jane Wanjiku",
      email: "jane@example.com",
      phone: "+254712345678",
      idNumber: "12345678",
      loanAmount: 300000,
      loanType: "Business Loan",
      maritalStatus: "Married",
      spouseName: "John Wanjiku",
      guarantorName: "Peter Njoroge",
      guarantorPhone: "+254700000000",
      purposeDetails: "Business expansion and stock purchases",
      status: "Pending"
    });
    localStorage.setItem(STORAGE_KEYS.applications, JSON.stringify(applications));
  }
}

seedDefaultData();

const tabButtons = document.querySelectorAll(".tab");
const authForm = document.getElementById("authForm");
const loanForm = document.getElementById("loanForm");
const authButton = document.getElementById("authButton");
const confirmPasswordWrapper = document.getElementById("confirmPasswordWrapper");
const confirmPasswordInput = document.getElementById("confirmPassword");
const adminOverlay = document.getElementById("adminOverlay");
const adminTableBody = document.getElementById("adminTableBody");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");
const whatsappLink = document.getElementById("whatsappLink");

let currentMode = "login";

function setMode(mode) {
  currentMode = mode;
  const isRegister = mode === "register";
  confirmPasswordWrapper.classList.toggle("hidden", !isRegister);
  authButton.textContent = isRegister ? "Create Account" : "Login";
  tabButtons.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === mode);
  });
}

tabButtons.forEach((tab) => {
  tab.addEventListener("click", () => setMode(tab.dataset.tab));
});

function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || "[]");
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function getApplications() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.applications) || "[]");
}

function saveApplications(applications) {
  localStorage.setItem(STORAGE_KEYS.applications, JSON.stringify(applications));
}

function showAdminDashboard() {
  renderAdminTable();
  adminOverlay.classList.remove("hidden");
}

function hideAdminDashboard() {
  adminOverlay.classList.add("hidden");
}

function registerUser(email, password) {
  const users = getUsers();
  const normalized = email.trim().toLowerCase();

  if (users.some((user) => user.email.toLowerCase() === normalized)) {
    alert("This email is already registered.");
    return false;
  }

  users.push({ email: normalized, password, role: "customer" });
  saveUsers(users);
  return true;
}

function loginUser(email, password) {
  const users = getUsers();
  return users.find(
    (user) =>
      user.email.toLowerCase() === email.trim().toLowerCase() &&
      user.password === password
  );
}

authForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();

  if (currentMode === "register") {
    const confirmPassword = confirmPasswordInput.value.trim();
    if (!confirmPassword || confirmPassword !== password) {
      alert("Passwords do not match.");
      return;
    }

    const created = registerUser(email, password);
    if (created) {
      alert("Account created successfully. Please log in.");
      setMode("login");
      authForm.reset();
    }
    return;
  }

  const user = loginUser(email, password);

  if (!user) {
    alert("Invalid email or password.");
    return;
  }

  if (user.role === "admin") {
    showAdminDashboard();
  } else {
    alert("Customer login successful. Your application has been submitted and is under review.");
  }
});

loanForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const application = {
    id: Date.now(),
    fullName: document.getElementById("fullName").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    idNumber: document.getElementById("idNumber").value.trim(),
    loanAmount: Number(document.getElementById("loanAmount").value),
    loanType: document.getElementById("loanType").value,
    maritalStatus: document.getElementById("maritalStatus").value,
    spouseName: document.getElementById("spouseName").value.trim(),
    guarantorName: document.getElementById("guarantorName").value.trim(),
    guarantorPhone: document.getElementById("guarantorPhone").value.trim(),
    purposeDetails: document.getElementById("purposeDetails").value.trim(),
    status: "Pending"
  };

  const applications = getApplications();
  applications.unshift(application);
  saveApplications(applications);

  alert("Application submitted successfully. Admin review is now underway.");
  loanForm.reset();
});

function renderAdminTable() {
  const applications = getApplications();
  adminTableBody.innerHTML = "";

  if (!applications.length) {
    adminTableBody.innerHTML = `<tr><td colspan="6">No applications available.</td></tr>`;
    return;
  }

  applications.forEach((app) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${app.fullName}</td>
      <td>${app.phone}</td>
      <td>${app.loanType}</td>
      <td>KSh ${Number(app.loanAmount).toLocaleString()}</td>
      <td><span class="status-badge status-${app.status.toLowerCase()}">${app.status}</span></td>
      <td>
        <button class="action-btn approve" data-action="approve" data-id="${app.id}">Approve</button>
        <button class="action-btn reject" data-action="reject" data-id="${app.id}">Reject</button>
      </td>
    `;
    adminTableBody.appendChild(row);
  });

  adminTableBody.querySelectorAll(".action-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      const id = Number(button.dataset.id);

      const applications = getApplications();
      const target = applications.find((app) => app.id === id);

      if (!target) return;

      target.status = action === "approve" ? "Approved" : "Rejected";
      saveApplications(applications);
      renderAdminTable();
    });
  });
}

adminLogoutBtn.addEventListener("click", () => {
  hideAdminDashboard();
  authForm.reset();
});

document.getElementById("portalBtn").addEventListener("click", () => {
  setMode("login");
  document.getElementById("apply").scrollIntoView({ behavior: "smooth" });
});

document.getElementById("applyBtn").addEventListener("click", () => {
  document.getElementById("apply").scrollIntoView({ behavior: "smooth" });
});

document.getElementById("heroApplyBtn").addEventListener("click", () => {
  document.getElementById("apply").scrollIntoView({ behavior: "smooth" });
});

document.getElementById("heroCardApplyBtn").addEventListener("click", () => {
  document.getElementById("apply").scrollIntoView({ behavior: "smooth" });
});

whatsappLink.addEventListener("click", (event) => {
  event.preventDefault();
  window.open(
    "https://wa.me/254118078137?text=Hello%20Real%20Alpha%20Shylock%20Loan%2C%20I%20need%20help%20with%20my%20loan%20application.",
    "_blank",
    "noopener,noreferrer"
  );
});

setMode("login");
hideAdminDashboard();
