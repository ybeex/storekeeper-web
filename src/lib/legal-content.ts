export type Section = { h: string; p: string[] };
export type LegalDoc = { slug: string; title: string; summary: string; sections: Section[] };

export const UPDATED = "4 October 2026";

export const LEGAL: LegalDoc[] = [
  {
    slug: "terms",
    title: "Terms of Service",
    summary: "The agreement between you and StoreKeeper for use of the service.",
    sections: [
      { h: "1. The service", p: ["StoreKeeper provides software for recording and reconciling the movement of physical tools, equipment and consumables. By creating an account or using the service you agree to these terms on behalf of yourself and the organization you represent."] },
      { h: "2. Accounts and organizations", p: ["You must provide accurate information and keep your credentials confidential. The person who creates an organization is responsible for the users they invite and the roles they assign. You are responsible for activity under your account.", "You must be at least 18 years old, or the age of majority where you live, to use the service."] },
      { h: "3. Your data", p: ["You retain ownership of the data you put into StoreKeeper, including item records, transactions, people and uploaded files. You grant us a limited licence to host, process and display that data solely to provide and secure the service.", "Because the ledger is designed to be immutable, transactions are corrected with new records rather than deleted. Items that appear in history are archived, not erased."] },
      { h: "4. Acceptable use", p: ["You agree to follow our Acceptable Use Policy. We may suspend access that threatens the security, stability or lawful operation of the service."] },
      { h: "5. Fees", p: ["Paid plans are charged as described in your order or pilot agreement. Unless otherwise agreed, fees are billed per store or location in advance and are non-refundable except where required by law. We will give notice before changing fees."] },
      { h: "6. Availability", p: ["We aim for high availability but do not guarantee uninterrupted service. Planned maintenance will be announced where practical. The service includes offline-tolerant features, but you remain responsible for physical controls over your inventory."] },
      { h: "7. Termination", p: ["You may stop using the service at any time. We may suspend or terminate accounts for material breach. On termination you may export your data for a reasonable period, after which it may be deleted in line with our retention practices."] },
      { h: "8. Disclaimers and liability", p: ["The service is provided as is to the extent permitted by law. We are not liable for indirect or consequential loss, or for loss of inventory, which depends on physical handling outside our control. Our total liability is limited to the fees you paid in the twelve months before the claim, except where the law does not allow this limit."] },
      { h: "9. Changes and contact", p: ["We may update these terms and will give reasonable notice of material changes. Questions can be sent to [legal contact email]. These terms are governed by the laws of [governing jurisdiction]."] },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary: "What personal data we collect, why we collect it and the choices you have.",
    sections: [
      { h: "1. Who we are", p: ["[Legal entity name] (\"StoreKeeper\") is the controller of account and usage data described here. For the inventory and people records your organization enters, your organization is the controller and we act as its processor under our Data Processing terms."] },
      { h: "2. What we collect", p: ["Account data: name, email address, organization, role and encrypted password. Operational data: items, quantities, holders, transactions, locations, notes and photos you upload. Technical data: IP address, device and browser type, session records and security logs."] },
      { h: "3. How we use it", p: ["To provide and secure the service, authenticate users, send operational notifications such as low-stock and overdue alerts, prevent abuse, support customers, and improve reliability. We do not sell personal data and we do not use your inventory records for advertising."] },
      { h: "4. Legal bases", p: ["Where required, we rely on performance of a contract, our legitimate interests in operating a secure service, compliance with legal obligations, and consent for optional communications."] },
      { h: "5. Sharing", p: ["We share data only with service providers who help us run StoreKeeper, such as hosting, storage and email delivery, under written terms that protect it. We may disclose data where required by law."] },
      { h: "6. Retention", p: ["We keep data while your account is active. Audit and transaction records are retained as part of the ledger. After termination we delete or anonymize data within a reasonable period unless the law requires us to keep it."] },
      { h: "7. Your rights", p: ["Depending on where you live, you may have the right to access, correct, export or delete your personal data and to object to certain processing. Contact [privacy contact email]. You may also complain to your data protection authority."] },
      { h: "8. Security and transfers", p: ["We use encryption in transit, hashed credentials, role-based access and tenant isolation. If data is transferred internationally we use appropriate safeguards."] },
      { h: "9. Changes", p: ["We will post updates here and notify account owners of material changes."] },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie Policy",
    summary: "How StoreKeeper uses cookies and similar browser storage.",
    sections: [
      { h: "1. What we store", p: ["StoreKeeper uses a small amount of browser storage that is strictly necessary to run the app: your signed-in session token, and your chosen colour theme. These are not used for advertising or cross-site tracking."] },
      { h: "2. Analytics", p: ["If we add analytics to the public website we will describe it here and ask for consent where the law requires."] },
      { h: "3. Your choices", p: ["You can clear stored data in your browser at any time. Doing so signs you out and resets your theme. Blocking necessary storage will prevent sign-in from working."] },
    ],
  },
  {
    slug: "acceptable-use",
    title: "Acceptable Use Policy",
    summary: "What you may and may not do with the service.",
    sections: [
      { h: "1. Do not misuse the service", p: ["Do not attempt to access other organizations' data, probe or test the security of the service without written permission, overload or disrupt it, or reverse engineer it except as the law allows."] },
      { h: "2. Do not upload harmful content", p: ["Do not upload malware, unlawful content, or material that infringes others' rights. Photos and notes should relate to inventory operations."] },
      { h: "3. Respect people's data", p: ["Only record personal data about staff and contractors that you have a lawful reason to hold, and keep it to what accountability needs."] },
      { h: "4. Enforcement", p: ["We may remove content or suspend accounts that breach this policy, and will try to give notice where practical."] },
    ],
  },
  {
    slug: "data-processing",
    title: "Data Processing Terms",
    summary: "How we process personal data on behalf of your organization.",
    sections: [
      { h: "1. Roles", p: ["For personal data in your organization's records, you are the controller and StoreKeeper is the processor. We process it only on your documented instructions, which are the use of the service."] },
      { h: "2. Confidentiality and security", p: ["Everyone with access is bound by confidentiality. We maintain technical and organizational measures described on our Security page."] },
      { h: "3. Sub-processors", p: ["We use sub-processors for hosting, file storage and email delivery. We remain responsible for them and will give notice of material changes so you can object."] },
      { h: "4. Assistance and deletion", p: ["We will help you respond to data subject requests and security reviews. On termination we will return or delete personal data on request, subject to legal retention duties."] },
      { h: "5. Incidents", p: ["We will notify you without undue delay after becoming aware of a personal data breach affecting your data."] },
    ],
  },
  {
    slug: "security",
    title: "Security",
    summary: "The controls that protect your store records.",
    sections: [
      { h: "1. Access control", p: ["Role-based access (administrator, supervisor, store staff, viewer) is enforced on the server, never only in the interface. Each organization's data is isolated from every other."] },
      { h: "2. Data protection", p: ["Traffic is encrypted with HTTPS. Passwords are stored as one-way hashes. Uploaded files are held in private storage and served through short-lived links."] },
      { h: "3. Integrity", p: ["Quantity-changing actions are transactional and protected against duplicates, retries and race conditions. History is append-only: corrections are new records, and material actions are written to an audit log."] },
      { h: "4. Reporting a vulnerability", p: ["Please report suspected vulnerabilities to [security contact email]. We will acknowledge reports promptly and will not pursue good-faith research that respects user data and service availability."] },
    ],
  },
];
