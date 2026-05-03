export class User {
  constructor(row = {}) {
    this.id = row.id || null;
    this.fullName = row.full_name || row.fullName || "";
    this.email = row.email || "";
    this.role = row.role || "visitor";
    this.organization = row.organization || null;
    this.status = row.status || "active";
    this.institutionEmail = row.institution_email || null;
    this.phoneNumber = row.phone_number || null;
    this.departmentName = row.department_name || null;
    this.positionTitle = row.position_title || null;
    this.employeeCode = row.employee_code || null;
    this.researchFocus = row.research_focus || null;
    this.verificationDocumentName = row.verification_document_name || null;
    this.verificationDocumentUrl = row.verification_document_url || null;
    this.verificationStatus = row.verification_status || "submitted";
    this.createdAt = row.created_at || null;
    this.updatedAt = row.updated_at || null;
  }

  isResearcher() { return this.role === "researcher"; }
  isAdmin() { return this.role === "admin"; }
  isVerified() { return this.verificationStatus === "verified"; }
  toPublicJSON() {
    return {
      id: this.id,
      fullName: this.fullName,
      email: this.email,
      role: this.role,
      organization: this.organization
    };
  }
}

export class Researcher extends User {
  constructor(row = {}) {
    super({ ...row, role: "researcher" });
  }
}

export class Admin extends User {
  constructor(row = {}) {
    super({ ...row, role: "admin" });
  }
}
