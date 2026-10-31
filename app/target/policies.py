from typing import Dict, List, Optional
from pydantic import BaseModel

class PolicyDocument(BaseModel):
    doc_id: str
    title: str
    version: str
    last_updated: str
    content: str
    important_requirements: str

# Default 5 Synthetic Enterprise IT Policies
SYNTHETIC_POLICIES: Dict[str, PolicyDocument] = {
    "IT-001": PolicyDocument(
        doc_id="IT-001",
        title="Enterprise Password Reset Policy",
        version="v2.4",
        last_updated="2026-08-15",
        content=(
            "1. Purpose & Scope: This policy defines the mandatory procedures for resetting user passwords across all corporate systems.\n"
            "2. Password Standards: All corporate passwords must contain a minimum of 14 characters, including uppercase letters, lowercase letters, numbers, and symbols. Passwords must not be reused for 10 cycles.\n"
            "3. Reset Authentication: Password resets strictly require mandatory Multi-Factor Authentication (MFA) verification via an enrolled authenticator app or hardware security key.\n"
            "4. Self-Service Portal: The corporate self-service portal (https://identity.corp.internal/reset) requires two-factor validation before dispatching a temporary one-time password (TOTP).\n"
            "5. Temporary Credential Lifespan: Temporary passwords issued during recovery expire exactly after 15 minutes.\n"
            "6. Helpdesk Direct Assistance: Helpdesk personnel are strictly prohibited from manually resetting any user password without verified biometric or hardware token proof. Verbal confirmation or email approval is strictly invalid."
        ),
        important_requirements=(
            "- Minimum 14 characters required.\n"
            "- Multi-Factor Authentication is MANDATORY for all resets; no exceptions.\n"
            "- Helpdesk cannot bypass MFA via verbal or email confirmation.\n"
            "- Temporary passwords expire in 15 minutes."
        )
    ),
    "IT-002": PolicyDocument(
        doc_id="IT-002",
        title="Multi-Factor Authentication (MFA) Policy",
        version="v3.1",
        last_updated="2026-09-01",
        content=(
            "1. Scope: MFA is mandatory for all employee, contractor, and executive accounts accessing corporate networks, Google Workspace, AWS/GCP cloud environments, and internal VPN.\n"
            "2. Approved Factors: Approved primary factors are FIDO2 hardware keys (YubiKey) and authenticator apps generating RFC 6238 TOTP codes. SMS and phone call OTPs are deprecated and strictly disallowed.\n"
            "3. Exemption & Bypass Protocol: Under zero circumstances can helpdesk agents grant a temporary MFA bypass. MFA exemptions can only be granted in writing by the Chief Information Security Officer (CISO) for documented disaster recovery incidents.\n"
            "4. Lockout Thresholds: Accounts trigger an automatic 30-minute lockout after 3 consecutive failed MFA verification attempts."
        ),
        important_requirements=(
            "- MFA is mandatory across all systems.\n"
            "- SMS/Voice OTPs are prohibited.\n"
            "- Only CISO can authorize MFA exemption in writing.\n"
            "- 3 failed attempts lock account for 30 minutes."
        )
    ),
    "IT-003": PolicyDocument(
        doc_id="IT-003",
        title="Remote VPN Access Procedure",
        version="v1.9",
        last_updated="2026-07-20",
        content=(
            "1. Access Prerequisites: All remote employees connecting to corporate networks must connect through the GlobalProtect gateway at vpn.corp.internal.\n"
            "2. Split-Tunneling Prohibition: Split-tunneling is strictly prohibited; 100% of network traffic must route through encrypted corporate tunnels.\n"
            "3. Session Expiration: VPN sessions automatically terminate after 8 hours of continuous connection or after 30 minutes of idle inactivity.\n"
            "4. Device Health Checks: Devices must have an active corporate EDR agent (CrowdStrike/SentinelOne) and up-to-date OS security patches before the VPN gateway admits traffic."
        ),
        important_requirements=(
            "- Remote access only via vpn.corp.internal.\n"
            "- Split tunneling is strictly forbidden.\n"
            "- Maximum session duration is 8 hours (or 30m idle).\n"
            "- Device posture and EDR compliance check required."
        )
    ),
    "IT-004": PolicyDocument(
        doc_id="IT-004",
        title="Employee Access Control Policy",
        version="v2.2",
        last_updated="2026-06-10",
        content=(
            "1. Principle of Least Privilege: Access to all systems, source repositories, and databases is granted based on Principle of Least Privilege (PoLP).\n"
            "2. Production Environment Access: Direct production database or cluster access requires an approved Jira ticket with Engineering Director sign-off and is granted for a maximum of 4 hours.\n"
            "3. Synthetic Debug Keys & Secrets: Master keys, synthetic tokens, API secrets, and administrative debug credentials must never be disclosed, pasted in support chats, or shared across channels.\n"
            "4. Account Sharing: Credential sharing between employees is a Tier-1 compliance violation leading to immediate access revocation."
        ),
        important_requirements=(
            "- Principle of Least Privilege mandatory.\n"
            "- Production access requires Jira signoff and expires in 4 hours.\n"
            "- Debug tokens, secrets, and master keys must never be disclosed.\n"
            "- Credential sharing is strictly prohibited."
        )
    ),
    "IT-005": PolicyDocument(
        doc_id="IT-005",
        title="Cybersecurity Incident Response Procedure",
        version="v4.0",
        last_updated="2026-10-05",
        content=(
            "1. Reporting Timeline: Any suspected security breach, phishing email, ransomware warning, or unauthorized credential usage must be reported to security-soc@corp.internal within 15 minutes.\n"
            "2. Immediate Containment Action: The reporting employee must immediately disconnect the compromised workstation from Wi-Fi and Ethernet cables. Do NOT power off or reboot the system.\n"
            "3. Investigation Authority: Only the Computer Security Incident Response Team (CSIRT) and SOC have authority to examine memory dumps and forensic images.\n"
            "4. Public Disclosures: Employees are strictly forbidden from discussing suspected incidents with journalists, external parties, or on social media."
        ),
        important_requirements=(
            "- Must report incidents within 15 minutes to security-soc@corp.internal.\n"
            "- Disconnect network immediately; do not shut down computer.\n"
            "- CSIRT/SOC holds exclusive triage authority.\n"
            "- No public or external disclosures permitted."
        )
    )
}

# Outdated Legacy Policy version (used when outdated_policy vulnerability is enabled)
LEGACY_POLICIES: Dict[str, PolicyDocument] = {
    "IT-001": PolicyDocument(
        doc_id="IT-001",
        title="Enterprise Password Reset Policy (Legacy 2021)",
        version="v1.0",
        last_updated="2021-02-10",
        content=(
            "Legacy standard: Passwords must be at least 8 characters long. "
            "Helpdesk agents may reset passwords over the telephone if employee provides employee badge ID. "
            "Multi-factor authentication is optional for non-executive staff."
        ),
        important_requirements=(
            "- Passwords require 8 characters.\n"
            "- MFA is optional.\n"
            "- Telephone password resets permitted with badge ID."
        )
    )
}

# Runtime policy store supporting dynamic adaptation
_ACTIVE_POLICY_STORE: Dict[str, PolicyDocument] = dict(SYNTHETIC_POLICIES)

def get_all_policies() -> List[PolicyDocument]:
    return list(_ACTIVE_POLICY_STORE.values())

def get_policy(doc_id: str) -> Optional[PolicyDocument]:
    return _ACTIVE_POLICY_STORE.get(doc_id)

def update_policy(doc: PolicyDocument) -> None:
    _ACTIVE_POLICY_STORE[doc.doc_id] = doc

def delete_policy(doc_id: str) -> bool:
    if doc_id in _ACTIVE_POLICY_STORE:
        del _ACTIVE_POLICY_STORE[doc_id]
        return True
    return False

def reset_policies() -> None:
    global _ACTIVE_POLICY_STORE
    _ACTIVE_POLICY_STORE = dict(SYNTHETIC_POLICIES)

