"""Shared input validation for IAMS API payloads."""

import re
from typing import Any, Optional, Tuple

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
# Kenya mobile: 07XXXXXXXX, 01XXXXXXXX, +2547..., +2541...
PHONE_RE = re.compile(r"^(\+254|254|0)?[17]\d{8}$")
REG_NUMBER_RE = re.compile(r"^[\w./-]{3,50}$")


def _strip(s: Any, max_len: int) -> str:
    if s is None:
        return ""
    t = str(s).strip()
    if len(t) > max_len:
        return t[:max_len]
    return t


def validate_presence(value: Any, field_label: str, max_len: int = 500) -> Tuple[Optional[str], str]:
    """Returns (error_message_or_None, stripped_value)."""
    v = _strip(value, max_len)
    if not v:
        return f"{field_label} is required", ""
    return None, v


def validate_email(value: Any) -> Tuple[Optional[str], str]:
    v = _strip(value, 100)
    if not v:
        return "Email is required", ""
    if not EMAIL_RE.match(v):
        return "Invalid email format", ""
    return None, v


def validate_phone_ke(value: Any) -> Tuple[Optional[str], str]:
    """Kenya-style mobile numbers (digits after normalizing)."""
    raw = _strip(value, 30)
    if not raw:
        return "Phone number is required", ""
    digits = re.sub(r"\s+", "", raw)
    if not PHONE_RE.match(digits):
        return "Enter a valid Kenya phone number (e.g. 07XXXXXXXX or +2547XXXXXXXX)", ""
    return None, digits


def validate_registration_number(value: Any) -> Tuple[Optional[str], str]:
    v = _strip(value, 50)
    if not v:
        return "Registration / index number is required", ""
    if not REG_NUMBER_RE.match(v):
        return "Registration number must be 3–50 characters (letters, digits, /, -, _)", ""
    return None, v


def validate_password(value: Any, min_len: int = 8) -> Tuple[Optional[str], str]:
    v = _strip(value, 128)
    if len(v) < min_len:
        return f"Password must be at least {min_len} characters", ""
    return None, v


def validate_lecturer_payload(data: dict) -> Tuple[Optional[str], dict]:
    """
    Validates body for POST /api/admin/add-lecturer and PUT /api/admin/lecturer/:id.
    Returns (error_message_or_None, normalized_dict).
    """
    if not isinstance(data, dict):
        return "Invalid JSON body", {}

    err, name = validate_presence(data.get("name"), "Name", 100)
    if err:
        return err, {}

    err, school = validate_presence(data.get("school"), "School", 100)
    if err:
        return err, {}

    err, department = validate_presence(data.get("department"), "Department", 100)
    if err:
        return err, {}

    err, phone = validate_phone_ke(data.get("phone"))
    if err:
        return err, {}

    err, email = validate_email(data.get("email"))
    if err:
        return err, {}

    region_key = data.get("residenceRegion") if data.get("residenceRegion") is not None else data.get("residence_region")
    err, residence_region = validate_presence(region_key, "Residence region", 100)
    if err:
        return err, {}

    pw = data.get("password")
    if pw is not None and str(pw).strip() != "":
        err, password = validate_password(pw, min_len=8)
        if err:
            return err, {}
    else:
        password = None

    return None, {
        "name": name,
        "school": school,
        "department": department,
        "phone": phone,
        "email": email,
        "residenceRegion": residence_region,
        "password": password,
    }


def validate_company_supervisor_payload(data: dict) -> Tuple[Optional[str], dict]:
    """
    Validates body for POST /api/admin/add-company-supervisor.
    Login uses email as username; password is stored hashed in company_supervisors.
    """
    if not isinstance(data, dict):
        return "Invalid JSON body", {}

    err, name = validate_presence(data.get("name"), "Name", 100)
    if err:
        return err, {}

    err, company_name = validate_presence(data.get("companyName") or data.get("company_name"), "Company name", 200)
    if err:
        return err, {}

    err, phone = validate_phone_ke(data.get("phone"))
    if err:
        return err, {}

    err, email = validate_email(data.get("email"))
    if err:
        return err, {}

    pw = data.get("password")
    if pw is not None and str(pw).strip() != "":
        err, password = validate_password(pw, min_len=8)
        if err:
            return err, {}
    else:
        password = None

    return None, {
        "name": name,
        "companyName": company_name,
        "phone": phone,
        "email": email,
        "password": password,
    }


def validate_assumption_duty(data: dict) -> Tuple[Optional[str], dict]:
    """Validates POST /api/student/assumption-duty."""
    if not isinstance(data, dict):
        return "Invalid JSON body", {}

    err, index_number = validate_registration_number(data.get("indexNumber"))
    if err:
        return err, {}

    err, company_name = validate_presence(data.get("companyName"), "Company name", 200)
    if err:
        return err, {}

    err, supervisor_name = validate_presence(data.get("supervisorName"), "Supervisor name", 100)
    if err:
        return err, {}

    err, supervisor_contact = validate_phone_ke(data.get("supervisorContact"))
    if err:
        return err, {}

    err, supervisor_email = validate_email(data.get("supervisorEmail"))
    if err:
        return err, {}

    err, company_region = validate_presence(data.get("companyRegion"), "Company region", 100)
    if err:
        return err, {}

    err, address = validate_presence(data.get("address"), "Address", 2000)
    if err:
        return err, {}

    return None, {
        "indexNumber": index_number,
        "companyName": company_name,
        "supervisorName": supervisor_name,
        "supervisorContact": supervisor_contact,
        "supervisorEmail": supervisor_email,
        "companyRegion": company_region,
        "address": address,
    }


def validate_student_register(data: dict) -> Tuple[Optional[str], dict]:
    """Validates POST /api/student/register."""
    if not isinstance(data, dict):
        return "Invalid JSON body", {}

    err, reg = validate_registration_number(data.get("indexNumber") or data.get("registrationNumber"))
    if err:
        return err, {}

    fn = _strip(data.get("firstName"), 100)
    ln = _strip(data.get("lastName"), 100)
    if not fn:
        return "First name is required", {}
    if not ln:
        return "Last name is required", {}

    err, department = validate_presence(data.get("department"), "Department", 100)
    if err:
        return err, {}

    err, school = validate_presence(data.get("school"), "School", 100)
    if err:
        return err, {}

    pw = data.get("password")
    err, password = validate_password(pw if pw is not None else "default123", min_len=6)
    if err:
        return err, {}

    return None, {
        "firstName": fn,
        "lastName": ln,
        "registrationNumber": reg,
        "department": department,
        "school": school,
        "password": password,
    }


def validate_score_int(value: Any, label: str, min_v: int, max_v: int) -> Tuple[Optional[str], int]:
    try:
        n = int(value)
    except (TypeError, ValueError):
        return f"{label} must be a whole number", 0
    if n < min_v or n > max_v:
        return f"{label} must be between {min_v} and {max_v}", 0
    return None, n


def validate_login_payload(data: dict, require_username: bool = True) -> Tuple[Optional[str], dict]:
    if not isinstance(data, dict):
        return "Invalid JSON body", {}
    password = data.get("password")
    if password is None or not str(password).strip():
        return "Password is required", {}
    if require_username:
        u = _strip(data.get("username"), 100)
        if not u:
            return "Username is required", {}
        return None, {"username": u, "password": str(password)}
    return None, {"password": str(password)}
