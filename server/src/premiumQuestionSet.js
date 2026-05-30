export const premiumQuestionSet = {
  name: "CyberSim Premium Awareness Drill",
  description:
    "Enterprise-grade timed scenarios covering phishing, social engineering, authentication, malware, AI threats, corporate incidents, mobile scams, and live response decisions.",
  questions: [
    {
      title: "The Salary Revision Mail",
      category: "Phishing & Email Attacks",
      difficulty: "Beginner 3/10",
      scenario:
        "At 9:12 AM, an email titled 'CONFIDENTIAL: Salary Revision FY26' says HR updated your compensation. The sender shows HR Team, but the address is hr-payroll@northbridge-careers.com while your company uses northbridge.com. It asks you to open Salary_Adjustment.xlsm before 11 AM or your revision will be delayed.",
      options: [
        "Open the file quickly because salary updates are time-sensitive",
        "Forward it to colleagues to check if they received it too",
        "Report it using the phishing button and do not open the attachment",
        "Reply asking HR to confirm whether it is legitimate"
      ],
      correctOptionIndex: 2,
      explanation:
        "The lookalike domain, urgency, confidential salary lure, and macro-enabled attachment are strong phishing indicators. Opening the file could execute malware. Forwarding spreads the lure. Replying confirms engagement to the attacker.",
      learningObjective: "Inspect sender domains, urgency language, and dangerous attachment types.",
      recommendedBehavior: "Do not open or reply. Report the email through the approved phishing channel."
    },
    {
      title: "The Password Reset That Arrived Too Fast",
      category: "Phishing & Email Attacks",
      difficulty: "Beginner 4/10",
      scenario:
        "Forty seconds after logging into Teams, you receive a Microsoft 365 email saying 'Unusual signin detected. Reset immediately.' The button points to https://microsoft-security-login.com/reset. The branding looks nearly identical to Microsoft.",
      options: [
        "Click the link because it mentions unusual sign-in activity",
        "Manually go to the official Microsoft 365 or company SSO portal",
        "Forward the email to your personal Gmail and inspect it later",
        "Enter your old password first and then change it"
      ],
      correctOptionIndex: 1,
      explanation:
        "The domain is not an official Microsoft login domain. Attackers often use security warnings to create urgency. Entering credentials on the fake page gives them direct account access.",
      learningObjective: "Recognize credential phishing even when branding looks polished.",
      recommendedBehavior: "Avoid email login links. Navigate manually through trusted bookmarks or the official SSO portal."
    },
    {
      title: "The Internship Offer",
      category: "Phishing & Email Attacks",
      difficulty: "Beginner 2/10",
      scenario:
        "A student receives an internship offer from careers@globaltech-internships.co. The sender asks for a resume, passport scan, bank details, and a refundable onboarding fee. The real company uses globaltech.com.",
      options: [
        "Send only the resume and ignore the bank details",
        "Pay the small fee because internships often need verification",
        "Verify the opportunity through the official company careers page",
        "Share the offer in the college WhatsApp group"
      ],
      correctOptionIndex: 2,
      explanation:
        "The domain mismatch, identity-document request, bank-detail request, and refundable fee are classic recruitment scam signs. Even a resume can help identity theft. Sharing spreads the scam.",
      learningObjective: "Identify student-targeted recruitment scams.",
      recommendedBehavior: "Verify offers through official career pages or known recruiter contacts before sending personal data."
    },
    {
      title: "The QR Code at Reception",
      category: "Phishing & Email Attacks",
      difficulty: "Intermediate 5/10",
      scenario:
        "A poster near the cafeteria says 'New WiFi Access - Scan QR to re-authenticate before 5 PM.' The QR opens a Google-looking login page for your corporate account. Facilities says they did not place the poster.",
      options: [
        "Scan and log in because WiFi notices are normal",
        "Use mobile data and report the poster to security or facilities",
        "Take a photo and post it in the office chat",
        "Enter only your email to see the next screen"
      ],
      correctOptionIndex: 1,
      explanation:
        "QR phishing hides the destination URL and can collect credentials. Posting the QR may cause others to scan it. Even entering only an email helps attackers target employees.",
      learningObjective: "Treat QR codes as links that require verification.",
      recommendedBehavior: "Do not scan or authenticate. Report unauthorized physical notices."
    },
    {
      title: "The Invoice Thread Hijack",
      category: "Phishing & Email Attacks",
      difficulty: "Advanced 7/10",
      scenario:
        "You are in a real vendor email thread. Suddenly, the vendor asks you to pay the current invoice to a new bank account due to 'RBI audit migration.' The email is accounts@vendarpay.com instead of accounts@vendorpay.com.",
      options: [
        "Process the payment because it is inside an existing thread",
        "Call the vendor using a previously verified phone number",
        "Reply asking them to resend the invoice on letterhead",
        "Ask your manager to approve the payment faster"
      ],
      correctOptionIndex: 1,
      explanation:
        "Business email compromise often abuses real threads and lookalike domains. Letterheads can be forged, and replying keeps you inside the attacker's channel.",
      learningObjective: "Detect vendor payment fraud and thread hijacking.",
      recommendedBehavior: "Verify bank-account changes out of band through a trusted vendor contact."
    },
    {
      title: "The IT Support Call",
      category: "Social Engineering Scenarios",
      difficulty: "Intermediate 4/10",
      scenario:
        "During a company town hall, someone claiming to be IT calls and says your laptop is causing network instability. They ask you to install AnyDesk so they can fix it before leadership notices.",
      options: [
        "Install AnyDesk because network issues are urgent",
        "Ask for their employee ID and then comply",
        "End the call and contact IT through the official helpdesk channel",
        "Give them your screen-sharing code but not your password"
      ],
      correctOptionIndex: 2,
      explanation:
        "Unexpected remote access requests are high-risk. Employee IDs can be invented. Screen-sharing can expose active sessions, documents, and internal systems.",
      learningObjective: "Recognize vishing and remote-access social engineering.",
      recommendedBehavior: "Refuse unsolicited remote access and verify through the official helpdesk."
    },
    {
      title: "The Manager Wants the OTP",
      category: "Social Engineering Scenarios",
      difficulty: "Beginner 3/10",
      scenario:
        "Your manager messages on WhatsApp: 'In a client call. Need the OTP sent to your phone for urgent vendor login. Send fast.' The profile photo and name match, but the tone feels unusual.",
      options: [
        "Send the OTP because it is your manager",
        "Call your manager on an official number or verify on Teams",
        "Ask what the OTP is for and send it if the answer sounds right",
        "Forward the OTP to the team group for visibility"
      ],
      correctOptionIndex: 1,
      explanation:
        "No legitimate workflow needs your OTP. Attackers can clone or compromise messaging accounts and provide convincing context.",
      learningObjective: "Understand OTP theft through authority pressure.",
      recommendedBehavior: "Never share OTPs. Verify urgent requests through a trusted channel."
    },
    {
      title: "The Helpful Stranger at the Door",
      category: "Social Engineering Scenarios",
      difficulty: "Beginner 2/10",
      scenario:
        "A person carrying coffee trays follows you into the office lobby and says, 'My access card is inside; can you hold the door?' They wear a vendor hoodie, but you do not recognize them.",
      options: [
        "Hold the door because it would be rude not to",
        "Let them in if they know a manager's name",
        "Politely direct them to reception or security",
        "Ask them to promise they work here"
      ],
      correctOptionIndex: 2,
      explanation:
        "Tailgating exploits politeness and helpfulness. Names and logos are easy to learn or copy. Verbal assurance is not access control.",
      learningObjective: "Recognize physical social engineering.",
      recommendedBehavior: "Require every unknown person to check in through reception or security."
    },
    {
      title: "The Discord Admin Extension",
      category: "Social Engineering Scenarios",
      difficulty: "Intermediate 5/10",
      scenario:
        "In a hackathon Discord, someone named 'CyberSim Admin' privately messages finalists. They say your team must install a browser extension to validate submissions before the leaderboard freezes.",
      options: [
        "Install it because it is from an admin",
        "Ask publicly in the official announcements channel whether it is legitimate",
        "Install it in incognito mode only",
        "Send it to one teammate to test first"
      ],
      correctOptionIndex: 1,
      explanation:
        "Display names are easy to spoof, and private messages create pressure. Incognito mode does not make extensions safe. Testing on a teammate only shifts the risk.",
      learningObjective: "Validate community-platform instructions.",
      recommendedBehavior: "Confirm tool installs through official public event channels."
    },
    {
      title: "The LinkedIn Recruiter File",
      category: "Social Engineering Scenarios",
      difficulty: "Intermediate 6/10",
      scenario:
        "A recruiter on LinkedIn offers a senior role and sends Job_Description.pdf.exe through a cloud link. They say the hiring panel closes in 20 minutes.",
      options: [
        "Download it because LinkedIn recruiter outreach is normal",
        "Open it on your phone instead of work laptop",
        "Do not download it; verify the role through the company's official website",
        "Rename the file to .pdf and open it"
      ],
      correctOptionIndex: 2,
      explanation:
        "The double extension, external cloud link, and time pressure indicate malware delivery. Renaming does not make an executable safe.",
      learningObjective: "Spot malware delivery through recruiter impersonation.",
      recommendedBehavior: "Verify opportunities on official domains and avoid unexpected executable downloads."
    },
    {
      title: "The Reused College Password",
      category: "Password & Authentication Security",
      difficulty: "Beginner 2/10",
      scenario:
        "A student uses the same password for college email, GitHub, and a gaming site. The gaming site announces a breach. Two hours later, someone tries logging into the student's GitHub.",
      options: [
        "Only change the gaming site password",
        "Change passwords on all reused accounts and enable MFA",
        "Wait to see whether GitHub sends another alert",
        "Delete the gaming account"
      ],
      correctOptionIndex: 1,
      explanation:
        "Credential stuffing tests breached passwords across services. Every account sharing the password is at risk, not just the breached site.",
      learningObjective: "Understand password reuse and credential stuffing.",
      recommendedBehavior: "Use unique passwords and MFA for important accounts."
    },
    {
      title: "The MFA Push Storm",
      category: "Password & Authentication Security",
      difficulty: "Intermediate 5/10",
      scenario:
        "At 11:48 PM, your phone receives seven MFA push notifications for your corporate account. One prompt says, 'Approve to stop alerts.' You did not try to sign in.",
      options: [
        "Approve one prompt to stop the notifications",
        "Deny the prompts, change your password through the official portal, and report it",
        "Turn off notifications and sleep",
        "Approve only if the location is your city"
      ],
      correctOptionIndex: 1,
      explanation:
        "This is likely MFA fatigue. Repeated prompts mean an attacker may know the password and is trying to get approval. Location can be proxied or inaccurate.",
      learningObjective: "Identify MFA fatigue attacks.",
      recommendedBehavior: "Deny unexpected prompts, change credentials safely, revoke sessions where possible, and report."
    },
    {
      title: "The Airport WiFi Login",
      category: "Password & Authentication Security",
      difficulty: "Intermediate 4/10",
      scenario:
        "At an airport, you join 'Free_Airport_5G'. The captive portal asks you to log in using Google, Microsoft, or Apple. You need to approve a client document from your work account.",
      options: [
        "Use Microsoft login because the portal offers it",
        "Use a VPN and manually access work, or use a mobile hotspot",
        "Enter credentials but change the password later",
        "Use your personal Gmail because it is less important"
      ],
      correctOptionIndex: 1,
      explanation:
        "Fake captive portals can steal credentials. Personal accounts may also recover or access work services. Changing later may be too late.",
      learningObjective: "Recognize public WiFi credential theft.",
      recommendedBehavior: "Treat public WiFi as untrusted and avoid identity-provider logins from captive portals."
    },
    {
      title: "The Shared Session Link",
      category: "Password & Authentication Security",
      difficulty: "Advanced 7/10",
      scenario:
        "A teammate sends a browser session export link so you can skip login into a test admin panel. The environment contains customer-like data. The URL includes a long token.",
      options: [
        "Use the link because it is only test data",
        "Ask for proper role-based access through SSO",
        "Open it in private browsing mode",
        "Shorten the link and save it for later"
      ],
      correctOptionIndex: 1,
      explanation:
        "Session tokens act like temporary credentials and can bypass authentication, MFA, and audit trails. Test systems often contain sensitive realistic data.",
      learningObjective: "Understand session-token risk.",
      recommendedBehavior: "Use named, role-based access through approved authentication."
    },
    {
      title: "The Password Manager Recovery Trap",
      category: "Password & Authentication Security",
      difficulty: "Advanced 8/10",
      scenario:
        "An email says your password manager vault will be deleted unless you confirm recovery words. The sender is support@passw0rdmanager-security.com and includes your real name and company.",
      options: [
        "Enter recovery words because losing the vault would be serious",
        "Contact the password manager through the official app or website",
        "Reply asking why deletion is happening",
        "Enter only half the recovery phrase"
      ],
      correctOptionIndex: 1,
      explanation:
        "Recovery words can grant full vault access. Personal details may come from breaches or public sources. Partial secrets can still help attackers.",
      learningObjective: "Protect password manager recovery material.",
      recommendedBehavior: "Never enter recovery phrases from links. Use the official app or website."
    },
    {
      title: "The Found USB Drive",
      category: "Malware & Device Safety",
      difficulty: "Beginner 2/10",
      scenario:
        "You find a USB drive labeled 'Q4 Bonus Plan' near the elevator. You are curious and your laptop is unlocked.",
      options: [
        "Plug it in but do not open files",
        "Give it to security or IT without plugging it in",
        "Open it on a personal laptop instead",
        "Ask colleagues if it belongs to them by passing it around"
      ],
      correctOptionIndex: 1,
      explanation:
        "USB devices can execute malware, emulate keyboards, or exploit drivers without opening files. Passing it around spreads the risk.",
      learningObjective: "Recognize USB drop attacks.",
      recommendedBehavior: "Do not connect unknown removable media. Hand it to security or IT."
    },
    {
      title: "The Cracked Design Tool",
      category: "Malware & Device Safety",
      difficulty: "Beginner 3/10",
      scenario:
        "A teammate sends a torrent link for a cracked premium design tool needed for a college demo. The installer asks you to disable antivirus temporarily.",
      options: [
        "Disable antivirus only during installation",
        "Install it inside your main user account",
        "Use legitimate software, trials, or approved alternatives",
        "Install it and run a scan afterward"
      ],
      correctOptionIndex: 2,
      explanation:
        "Cracked software is a common malware channel. Disabling antivirus is exactly what malware needs. A later scan may miss stolen data or persistence.",
      learningObjective: "Avoid trojanized cracked software.",
      recommendedBehavior: "Use licensed, trial, open-source, or approved alternatives."
    },
    {
      title: "The Game Mod APK",
      category: "Malware & Device Safety",
      difficulty: "Intermediate 4/10",
      scenario:
        "A Telegram group shares 'CyberSim Pro Coins Unlimited.apk'. Android warns that the app wants SMS, accessibility, notification, and overlay permissions.",
      options: [
        "Install it because many users downloaded it",
        "Install it but deny permissions",
        "Do not install it and report or remove the link",
        "Install it on a spare phone with your main Google account"
      ],
      correctOptionIndex: 2,
      explanation:
        "Malicious APKs request excessive permissions to steal OTPs, overlay login screens, and control devices. Download-count claims can be fake.",
      learningObjective: "Detect risky sideloaded mobile apps.",
      recommendedBehavior: "Avoid unofficial APKs and report malicious links."
    },
    {
      title: "The Productivity Extension",
      category: "Malware & Device Safety",
      difficulty: "Advanced 7/10",
      scenario:
        "A browser extension called 'Meeting Notes AI' asks to read and change all data on all websites. It has polished branding and hundreds of five-star reviews. You are logged into email, CRM, and GitHub.",
      options: [
        "Install it because reviews are positive",
        "Install it only in a separate browser profile with no sensitive accounts",
        "Check whether it is approved by IT and avoid broad-permission extensions",
        "Install and remove it after the meeting"
      ],
      correctOptionIndex: 2,
      explanation:
        "Extensions with broad permissions can steal cookies, tokens, page content, and credentials. Reviews can be fake or precede a malicious update.",
      learningObjective: "Understand browser extension privilege risk.",
      recommendedBehavior: "Use only approved extensions with minimal permissions."
    },
    {
      title: "The Ransomware Warning Signs",
      category: "Malware & Device Safety",
      difficulty: "Advanced 8/10",
      scenario:
        "Your laptop fans spike. Files in a shared folder start renaming with .locked. A ransom note demands crypto. You still have Slack and email access.",
      options: [
        "Disconnect from the network and notify IT/security from a separate trusted device",
        "Keep the laptop online to let IT remote in",
        "Pay the ransom quickly to stop encryption",
        "Delete the ransom note and reboot"
      ],
      correctOptionIndex: 0,
      explanation:
        "Fast containment reduces spread to network shares and other systems. Staying online can worsen damage. Rebooting or deleting notes can destroy evidence.",
      learningObjective: "Prioritize ransomware containment.",
      recommendedBehavior: "Isolate the device, preserve evidence, and report immediately."
    },
    {
      title: "The CFO Voice Note",
      category: "AI & Deepfake Cyber Threats",
      difficulty: "Advanced 8/10",
      scenario:
        "At 7:40 PM, a finance analyst receives a WhatsApp voice note that sounds exactly like the CFO: 'I am boarding a flight. Release the vendor advance now. Do not wait for email approval.'",
      options: [
        "Approve because the voice is clearly the CFO",
        "Verify through the official finance workflow and a known callback number",
        "Ask the sender to send one more voice note",
        "Process half the amount as a compromise"
      ],
      correctOptionIndex: 1,
      explanation:
        "AI voice cloning can imitate executives. More voice notes do not prove identity, and partial payment is still fraud.",
      learningObjective: "Recognize AI voice payment scams.",
      recommendedBehavior: "Use process-based finance controls and trusted callback verification."
    },
    {
      title: "The Deepfake Video Standup",
      category: "AI & Deepfake Cyber Threats",
      difficulty: "Advanced 9/10",
      scenario:
        "A startup founder joins a late-night video call with a major investor. The video looks slightly delayed, and the investor asks for production dashboard access to validate traction before tomorrow's term sheet.",
      options: [
        "Grant temporary admin access because funding is critical",
        "Share a screenshot of the dashboard instead",
        "Pause and verify using the investor's previously known email or phone number",
        "Ask the person on video to confirm their LinkedIn profile"
      ],
      correctOptionIndex: 2,
      explanation:
        "Deepfake calls exploit fundraising pressure. Temporary admin access and screenshots can still expose sensitive data. Public profile details are not proof.",
      learningObjective: "Handle deepfake executive and investor impersonation.",
      recommendedBehavior: "Verify high-impact access requests through trusted out-of-band channels."
    },
    {
      title: "The Perfectly Written Phish",
      category: "AI & Deepfake Cyber Threats",
      difficulty: "Intermediate 6/10",
      scenario:
        "An email references yesterday's real product launch, names three colleagues, and asks you to review final launch incident notes. The link goes to docs-googleworkspace.com.",
      options: [
        "Trust it because the context is accurate and grammar is perfect",
        "Open the link but do not download anything",
        "Check the domain and verify the document through official workspace channels",
        "Forward it to the named colleagues"
      ],
      correctOptionIndex: 2,
      explanation:
        "AI-generated phishing can be accurate and polished. The domain is suspicious. Opening may steal credentials even without downloads.",
      learningObjective: "Avoid trusting writing quality as a legitimacy signal.",
      recommendedBehavior: "Inspect domains and verify shared documents inside official workspace tools."
    },
    {
      title: "The Fake Support Bot",
      category: "AI & Deepfake Cyber Threats",
      difficulty: "Advanced 8/10",
      scenario:
        "A SaaS dashboard chat widget says: 'We detected API instability. Paste your API key here to validate affected services.' The bot uses your company name and logo.",
      options: [
        "Paste the key because the widget is inside the SaaS app",
        "Ask the bot for a ticket number and then paste it",
        "Open a support ticket through the official portal without sharing secrets",
        "Paste a read-only key if available"
      ],
      correctOptionIndex: 2,
      explanation:
        "Support bots should never ask for secrets. A page, script, or fake portal may be compromised. Read-only keys can still expose data.",
      learningObjective: "Protect API keys from fake support workflows.",
      recommendedBehavior: "Never paste secrets into chat. Use official support and secret-redaction processes."
    },
    {
      title: "The Manipulated Screenshot",
      category: "AI & Deepfake Cyber Threats",
      difficulty: "Advanced 7/10",
      scenario:
        "A project lead sends a screenshot showing security approved disabling SSO for a demo tenant. The screenshot appears to come from Slack, but you cannot find the original message in Slack search.",
      options: [
        "Proceed because screenshots are enough evidence",
        "Ask the project lead to resend a clearer screenshot",
        "Verify the approval in the original system or ask security directly",
        "Disable SSO only for one hour"
      ],
      correctOptionIndex: 2,
      explanation:
        "Screenshots can be manipulated by AI or simple editing. A clearer fake is still fake. Even brief SSO removal can enable compromise.",
      learningObjective: "Validate evidence in source-of-truth systems.",
      recommendedBehavior: "Treat screenshots as context, not approval records."
    },
    {
      title: "The GitHub Token Leak",
      category: "Corporate Security Incidents",
      difficulty: "Advanced 8/10",
      scenario:
        "A developer accidentally commits an AWS access key to a public GitHub repository. The commit is deleted after 12 minutes. The key had access to staging S3 buckets.",
      options: [
        "Do nothing because the commit was deleted quickly",
        "Rotate or revoke the key, check logs, and notify security",
        "Make the repository private and continue",
        "Ask GitHub support to remove the cached commit only"
      ],
      correctOptionIndex: 1,
      explanation:
        "Secrets can be harvested within seconds. Deleting commits or hiding the repo does not invalidate a secret or prove it was unused.",
      learningObjective: "Respond to exposed credentials.",
      recommendedBehavior: "Revoke exposed keys immediately, review logs, and escalate."
    },
    {
      title: "The Public Drive Link",
      category: "Corporate Security Incidents",
      difficulty: "Intermediate 5/10",
      scenario:
        "Marketing shares a Google Drive folder as 'Anyone with the link can view' for an agency. It also contains unreleased pricing sheets and customer logos under NDA.",
      options: [
        "Leave it because only people with the link can access it",
        "Restrict sharing, review access logs if available, and notify the data owner/security",
        "Rename the sensitive files",
        "Ask the agency to promise not to share it"
      ],
      correctOptionIndex: 1,
      explanation:
        "Anyone-with-link access can spread beyond intended recipients. Renaming files or relying on promises does not control access.",
      learningObjective: "Recognize oversharing and least-privilege failures.",
      recommendedBehavior: "Restrict access, review exposure, and notify accountable owners."
    },
    {
      title: "The Cloud Storage Bucket",
      category: "Corporate Security Incidents",
      difficulty: "Advanced 7/10",
      scenario:
        "A startup discovers its analytics bucket is publicly readable. It contains event logs with user emails, IP addresses, and device metadata. The founder says, 'It is not passwords, so it is fine.'",
      options: [
        "Agree because no passwords are exposed",
        "Make the bucket private, preserve evidence, assess exposure, and notify security/legal as required",
        "Delete all logs immediately",
        "Move the bucket to another region"
      ],
      correctOptionIndex: 1,
      explanation:
        "Emails, IPs, and device metadata can be sensitive personal data. Deleting logs destroys evidence. Region changes do not fix permissions.",
      learningObjective: "Assess cloud exposure beyond passwords.",
      recommendedBehavior: "Contain public access, preserve evidence, and run incident assessment."
    },
    {
      title: "The Insider Export",
      category: "Corporate Security Incidents",
      difficulty: "Advanced 9/10",
      scenario:
        "A sales employee who recently resigned downloads the full customer list at midnight and emails a CSV to a personal account. Their manager says it was probably handover prep.",
      options: [
        "Ignore it because the employee still works here",
        "Disable access if policy allows, preserve logs, and escalate to security/HR/legal",
        "Ask the employee directly in the team chat",
        "Delete the email from mail logs"
      ],
      correctOptionIndex: 1,
      explanation:
        "Authorized users can misuse access. Direct confrontation can tip them off, and deleting logs destroys evidence.",
      learningObjective: "Handle insider-risk signals carefully.",
      recommendedBehavior: "Preserve evidence and escalate through security, HR, and legal workflows."
    },
    {
      title: "The Suspicious Office Charger",
      category: "Corporate Security Incidents",
      difficulty: "Intermediate 6/10",
      scenario:
        "A branded phone charger is left on a conference table after a vendor visit. A teammate wants to use it before a client call because their phone is dying.",
      options: [
        "Use it because it is only a charger",
        "Use a company-approved charger or power-only adapter and report the unknown device",
        "Plug it into a laptop first to test it",
        "Let the teammate use it since phones are sandboxed"
      ],
      correctOptionIndex: 1,
      explanation:
        "Malicious charging devices can attempt data access or emulate USB devices. Testing on a laptop increases the risk.",
      learningObjective: "Recognize physical device threats.",
      recommendedBehavior: "Use approved charging hardware and report unknown electronics."
    },
    {
      title: "The Instagram Blue Tick DM",
      category: "Mobile & Social Media Security",
      difficulty: "Beginner 2/10",
      scenario:
        "An account named 'Meta Verification Support' DMs a college creator: 'Your profile qualifies for verification. Complete the appeal form in 30 minutes.' The link asks for username, password, and backup codes.",
      options: [
        "Enter details because verification is time-sensitive",
        "Check verification only inside the official Instagram app settings",
        "Send only the backup codes",
        "Ask the account to prove it is Meta"
      ],
      correctOptionIndex: 1,
      explanation:
        "Platform verification happens through official app flows. Backup codes can bypass MFA. Attackers can fake proof and urgency.",
      learningObjective: "Recognize social media verification scams.",
      recommendedBehavior: "Use official in-app security and verification settings."
    },
    {
      title: "The WhatsApp Six-Digit Code",
      category: "Mobile & Social Media Security",
      difficulty: "Beginner 3/10",
      scenario:
        "A friend messages: 'I accidentally sent my WhatsApp code to your number. Please forward the six digits.' Seconds later, you receive an actual WhatsApp verification SMS.",
      options: [
        "Forward it because it belongs to your friend",
        "Do not share it and call your friend through another channel",
        "Send only the last three digits",
        "Post a screenshot with the code hidden"
      ],
      correctOptionIndex: 1,
      explanation:
        "The code controls your account, not your friend's. Partial codes and screenshots can still help attackers manipulate or recover accounts.",
      learningObjective: "Prevent messaging account takeover.",
      recommendedBehavior: "Never share verification codes. Verify unusual requests separately."
    },
    {
      title: "The Telegram Investment Group",
      category: "Mobile & Social Media Security",
      difficulty: "Intermediate 5/10",
      scenario:
        "A Telegram group claims CyberSim players can double prize winnings through a sponsor-backed crypto pool. Admins show payout screenshots and pressure users to connect wallets before the final round.",
      options: [
        "Connect a wallet with a small balance",
        "Ignore and report the group to event organizers",
        "Ask other members if it worked",
        "Connect using mobile data instead of WiFi"
      ],
      correctOptionIndex: 1,
      explanation:
        "Fake investment groups use social proof, screenshots, urgency, and bots. Wallet drainers can steal funds or approvals regardless of network.",
      learningObjective: "Spot group-chat investment manipulation.",
      recommendedBehavior: "Do not connect wallets from unsolicited group links. Report impersonation to organizers."
    },
    {
      title: "The Shortened Giveaway Link",
      category: "Mobile & Social Media Security",
      difficulty: "Beginner 3/10",
      scenario:
        "A viral post says 'Free premium headphones for the first 500 students' and uses a shortened URL. The landing page asks for college email login to verify eligibility.",
      options: [
        "Log in because student giveaways often need verification",
        "Expand or check the URL and verify the campaign on the brand's official site",
        "Use a weak password so it does not matter",
        "Share it quickly before slots finish"
      ],
      correctOptionIndex: 1,
      explanation:
        "Shortened URLs hide destinations, and fake giveaways commonly harvest credentials. Sharing quickly spreads the scam.",
      learningObjective: "Detect giveaway phishing.",
      recommendedBehavior: "Verify promotions through official brand channels before logging in."
    },
    {
      title: "The SIM Swap Warning",
      category: "Mobile & Social Media Security",
      difficulty: "Advanced 7/10",
      scenario:
        "Your phone suddenly loses signal. Minutes later, your email receives password reset alerts for banking and social accounts. Customer care says a duplicate SIM request was processed.",
      options: [
        "Wait because network outages happen",
        "Contact the carrier fraud team, secure accounts, and alert banks",
        "Restart the phone repeatedly",
        "Post on social media asking if others lost signal"
      ],
      correctOptionIndex: 1,
      explanation:
        "Signal loss plus reset alerts strongly suggests SIM swap. Delays let attackers receive OTPs. Public posts can reveal you are distracted.",
      learningObjective: "Recognize SIM swap attacks.",
      recommendedBehavior: "Escalate to carrier fraud support and secure critical accounts immediately."
    },
    {
      title: "The First Five Minutes",
      category: "Live Incident Response Decisions",
      difficulty: "Intermediate 6/10",
      scenario:
        "A user reports they clicked a suspicious payroll link and entered their password. They are still logged in and using the laptop. The drill timer starts: what should you do first?",
      options: [
        "Ask them to forward the phishing email to everyone as a warning",
        "Change password through official SSO, revoke sessions if possible, and report to security",
        "Tell them to delete browser history",
        "Wait for SOC to confirm compromise"
      ],
      correctOptionIndex: 1,
      explanation:
        "The password is already exposed. Forwarding spreads the link, deleting history removes evidence, and waiting gives attackers time.",
      learningObjective: "Prioritize credential-exposure response.",
      recommendedBehavior: "Contain the account, revoke sessions where possible, preserve evidence, and report."
    },
    {
      title: "The Suspicious Admin Login",
      category: "Live Incident Response Decisions",
      difficulty: "Advanced 8/10",
      scenario:
        "A SOC alert shows successful admin login from a foreign IP at 3:03 AM. The admin is asleep and cannot be reached. The account has cloud production privileges.",
      options: [
        "Disable or suspend the account according to emergency procedure and escalate",
        "Wait until morning to avoid disrupting work",
        "Send an email to the admin account asking if it was them",
        "Block only the foreign IP"
      ],
      correctOptionIndex: 0,
      explanation:
        "High-privilege unexpected access requires urgent containment. The attacker may control the admin email, and IP blocking alone is weak.",
      learningObjective: "Respond to privileged-account compromise.",
      recommendedBehavior: "Follow emergency containment procedures and escalate immediately."
    },
    {
      title: "The Leaked Customer CSV",
      category: "Live Incident Response Decisions",
      difficulty: "Intermediate 5/10",
      scenario:
        "A team lead accidentally posts a customer CSV in a public Slack channel with external guests. They delete it two minutes later. What is the biggest mistake to avoid?",
      options: [
        "Assuming deletion means the incident is over",
        "Notifying security",
        "Restricting channel access",
        "Preserving audit logs"
      ],
      correctOptionIndex: 0,
      explanation:
        "Deleted messages may already have been viewed, downloaded, cached, or forwarded. The other actions support containment and investigation.",
      learningObjective: "Understand data-leak containment limits.",
      recommendedBehavior: "Treat deleted leaks as incidents requiring access review, evidence, and escalation."
    },
    {
      title: "The Malware Popup",
      category: "Live Incident Response Decisions",
      difficulty: "Beginner 3/10",
      scenario:
        "An employee sees a full-screen browser popup saying 'Your device is infected. Call Microsoft Support now.' It plays an alarm sound and blocks the close button.",
      options: [
        "Call the number because it mentions Microsoft",
        "Enter payment details to unlock support",
        "Force close the browser if needed and report if anything was downloaded or entered",
        "Click every button until it disappears"
      ],
      correctOptionIndex: 2,
      explanation:
        "Fake antivirus popups create panic to drive phone scams and remote access fraud. Calling, paying, or clicking blindly increases risk.",
      learningObjective: "Respond safely to tech-support scams.",
      recommendedBehavior: "Close the page safely and report any interaction or download."
    },
    {
      title: "The Compromised Build Pipeline",
      category: "Live Incident Response Decisions",
      difficulty: "Advanced 9/10",
      scenario:
        "A DevOps engineer sees a CI job unexpectedly adding a deployment step that curls a script from pastebin-like storage. The job has production deploy permissions and is currently running.",
      options: [
        "Let it finish and review logs afterward",
        "Stop the job, preserve logs and artifacts, revoke exposed tokens if needed, and escalate",
        "Delete the CI job logs to stop leakage",
        "Comment on the pull request asking the author to explain"
      ],
      correctOptionIndex: 1,
      explanation:
        "Suspicious privileged automation can deploy backdoors or exfiltrate secrets quickly. Logs are evidence and should not be deleted.",
      learningObjective: "Contain CI/CD compromise under time pressure.",
      recommendedBehavior: "Stop suspicious privileged jobs, preserve evidence, rotate secrets as needed, and escalate."
    }
  ]
};
