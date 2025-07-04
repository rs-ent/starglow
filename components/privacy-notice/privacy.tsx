/// components/privacy-notice/privacy.tsx

import React from "react";

export default function PrivacyPolicy() {
    return (
        <div id="privacy" className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-white">
                    Privacy Policy
                </h1>
                <p className="text-sm text-gray-400">
                    Last Updated: {new Date().toLocaleDateString("en-US")}
                </p>
            </div>

            <div className="space-y-8">
                {/* 1. Introduction */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        1. Introduction
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            {`Starglow ("Company", "we", "us", or "our") is a
                            leading Web3 entertainment platform connecting K-pop
                            artists with fans through blockchain technology,
                            NFTs, and data-driven artist valuation. We provide
                            services including NFT creation and trading, artist
                            communities, fan engagement tools, and
                            blockchain-based entertainment experiences.`}
                        </p>
                        <p>
                            We know your personal information is important. As a
                            result, we process your personal information
                            responsibly and in accordance with applicable laws
                            and regulations.
                        </p>
                        <p>
                            {`This Privacy Policy ("Policy") describes how we
                            process the personal information collected when you
                            access our website at starglow.io, our Telegram Mini
                            App, mobile applications, and related services
                            (collectively, "Services").`}
                        </p>
                        <p>
                            Please read this Privacy Policy carefully. If you do
                            not agree with this Privacy Policy or any part
                            thereof, you should not access or use any part of
                            the Services.
                        </p>
                    </div>
                </section>

                {/* 2. Personal Information We Collect */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        2. Personal Information We Collect
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <h3 className="text-lg font-medium text-gray-200">
                            2.1 Information You Provide to Us
                        </h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong>Account Information:</strong> Email
                                address, username, password, profile picture
                            </li>
                            <li>
                                <strong>Profile Information:</strong> Name, date
                                of birth, gender, location, biography
                            </li>
                            <li>
                                <strong>Contact Information:</strong> Phone
                                number, mailing address
                            </li>
                            <li>
                                <strong>Payment Information:</strong> Credit
                                card details, bank account information, virtual
                                account details, cryptocurrency wallet
                                addresses, mobile payment information
                            </li>
                            <li>
                                <strong>Social Media Information:</strong>{" "}
                                Connected social media accounts and profiles
                            </li>
                            <li>
                                <strong>Identity Verification:</strong>{" "}
                                Government-issued ID, KYC/AML documentation
                            </li>
                        </ul>

                        <h3 className="text-lg font-medium text-gray-200">
                            2.2 Web3 and Blockchain Information
                        </h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong>Wallet Information:</strong>{" "}
                                Cryptocurrency wallet addresses (MetaMask, etc.)
                            </li>
                            <li>
                                <strong>NFT Data:</strong> Owned NFTs,
                                transaction history, metadata
                            </li>
                            <li>
                                <strong>Blockchain Transaction Data:</strong>{" "}
                                Transaction hashes, amounts, timestamps
                            </li>
                            <li>
                                <strong>Token Information:</strong> Token
                                balances, trading activity
                            </li>
                            <li>
                                <strong>Smart Contract Interactions:</strong>{" "}
                                Contract addresses, function calls
                            </li>
                            <li>
                                <strong>Temporary Wallet Management:</strong>{" "}
                                For user convenience and security purposes only,
                                we may temporarily store encrypted wallet
                                credentials for wallets created through our
                                platform.
                                <strong>
                                    {" "}
                                    We strongly encourage and continuously
                                    remind users to backup their private keys
                                    immediately.
                                </strong>
                                Upon user backup completion, all stored
                                credentials are permanently and irreversibly
                                deleted from our systems. Users are solely
                                responsible for securing their private keys
                                after backup.
                            </li>
                        </ul>

                        <h3 className="text-lg font-medium text-gray-200">
                            2.3 Artist and Fan Activity Information
                        </h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong>Artist Preferences:</strong> Followed
                                artists, favorite content
                            </li>
                            <li>
                                <strong>Fan Activity:</strong> Likes, comments,
                                shares, support history
                            </li>
                            <li>
                                <strong>Valuation Data:</strong> Artist
                                valuation contributions and predictions
                            </li>
                            <li>
                                <strong>Community Activity:</strong> Posts,
                                comments, votes, polls
                            </li>
                            <li>
                                <strong>Event Participation:</strong> Raffles,
                                quests, contests, live events
                            </li>
                        </ul>

                        <h3 className="text-lg font-medium text-gray-200">
                            2.4 Automatically Collected Information
                        </h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong>Device Information:</strong> IP address,
                                browser type, operating system
                            </li>
                            <li>
                                <strong>Usage Data:</strong> Pages visited, time
                                spent, click patterns
                            </li>
                            <li>
                                <strong>Cookies and Tracking:</strong> Session
                                cookies, analytics cookies
                            </li>
                            <li>
                                <strong>Location Data:</strong> General location
                                based on IP address
                            </li>
                            <li>
                                <strong>Performance Data:</strong> App
                                performance, crash reports
                            </li>
                        </ul>
                    </div>
                </section>

                {/* 3. How We Use Your Information */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        3. How We Use Your Information
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            We use your personal information for the following
                            purposes:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong>Service Provision:</strong> To provide
                                and maintain our Services, including account
                                creation and management
                            </li>
                            <li>
                                <strong>Web3 Functionality:</strong> To enable
                                blockchain transactions, NFT operations, wallet
                                connections, and provide temporary encrypted
                                wallet management for user convenience.
                                <strong>
                                    We do not desire to store private keys
                                </strong>{" "}
                                and actively encourage immediate backup and
                                self-custody.
                            </li>
                            <li>
                                <strong>Artist-Fan Connections:</strong> To
                                facilitate connections between artists and fans,
                                including personalized content
                            </li>
                            <li>
                                <strong>Community Features:</strong> To enable
                                community participation, voting, and social
                                interactions
                            </li>
                            <li>
                                <strong>Payment Processing:</strong> To process
                                payments through various methods (cards, virtual
                                accounts, cryptocurrency), handle transactions,
                                verify payments, and manage digital asset
                                purchases
                            </li>
                            <li>
                                <strong>Security and Fraud Prevention:</strong>{" "}
                                To protect against fraud, abuse, and security
                                threats
                            </li>
                            <li>
                                <strong>Analytics and Improvement:</strong> To
                                analyze usage patterns and improve our Services
                            </li>
                            <li>
                                <strong>Communications:</strong> To send
                                important updates, notifications, and marketing
                                communications
                            </li>
                            <li>
                                <strong>Legal Compliance:</strong> To comply
                                with legal obligations, including KYC/AML
                                requirements
                            </li>
                            <li>
                                <strong>Customer Support:</strong> To provide
                                customer service and technical support
                            </li>
                        </ul>
                    </div>
                </section>

                {/* 4. How We Share Your Information */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        4. How We Share Your Information
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            We may share your personal information in the
                            following circumstances:
                        </p>

                        <h3 className="text-lg font-medium text-gray-200">
                            4.1 Service Providers
                        </h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Cloud hosting and storage providers</li>
                            <li>
                                Payment processors and financial service
                                providers (including PortOne, card companies,
                                banks, cryptocurrency exchanges)
                            </li>
                            <li>Analytics and marketing service providers</li>
                            <li>Customer support and communication tools</li>
                            <li>Security and fraud prevention services</li>
                        </ul>

                        <h3 className="text-lg font-medium text-gray-200">
                            4.2 Blockchain and Public Information
                        </h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                Blockchain transactions are publicly visible on
                                the blockchain
                            </li>
                            <li>
                                NFT ownership and trading history may be
                                publicly accessible
                            </li>
                            <li>
                                Smart contract interactions are recorded on
                                public blockchains
                            </li>
                        </ul>

                        <h3 className="text-lg font-medium text-gray-200">
                            4.3 Legal Requirements
                        </h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                To comply with legal obligations and regulatory
                                requirements
                            </li>
                            <li>
                                To respond to legal requests and court orders
                            </li>
                            <li>To protect our rights, property, and safety</li>
                            <li>
                                To prevent fraud and enforce our terms of
                                service
                            </li>
                        </ul>

                        <h3 className="text-lg font-medium text-gray-200">
                            4.4 Business Transfers
                        </h3>
                        <p>
                            In the event of a merger, acquisition, or sale of
                            assets, your information may be transferred to the
                            new entity.
                        </p>
                    </div>
                </section>

                {/* 5. Your Rights and Choices */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        5. Your Rights and Choices
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            You have the following rights regarding your
                            personal information:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong>Access:</strong> Request access to your
                                personal information we hold
                            </li>
                            <li>
                                <strong>Correction:</strong> Request correction
                                of inaccurate information
                            </li>
                            <li>
                                <strong>Deletion:</strong> Request deletion of
                                your personal information
                            </li>
                            <li>
                                <strong>Portability:</strong> Request transfer
                                of your information to another service
                            </li>
                            <li>
                                <strong>Objection:</strong> Object to processing
                                based on legitimate interests
                            </li>
                            <li>
                                <strong>Restriction:</strong> Request
                                restriction of processing
                            </li>
                            <li>
                                <strong>Withdraw Consent:</strong> Withdraw
                                consent for processing
                            </li>
                        </ul>
                        <p>
                            To exercise these rights, please contact us at
                            contact@starglow.io. We will respond to your request
                            within 30 days.
                        </p>
                    </div>
                </section>

                {/* 6. Data Security */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        6. Data Security
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            We implement appropriate technical and
                            organizational measures to protect your personal
                            information against unauthorized access, alteration,
                            disclosure, or destruction.
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Encryption of data in transit and at rest</li>
                            <li>
                                Multi-factor authentication for account access
                            </li>
                            <li>
                                Regular security audits and penetration testing
                            </li>
                            <li>Access controls and employee training</li>
                            <li>Secure development practices</li>
                        </ul>
                        <p>
                            However, no method of transmission over the Internet
                            is 100% secure. We cannot guarantee the absolute
                            security of your information.
                        </p>
                    </div>
                </section>

                {/* 7. International Data Transfers */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        7. International Data Transfers
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            Your personal information may be transferred to and
                            processed in countries other than your country of
                            residence. We ensure appropriate safeguards are in
                            place for such transfers, including:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Adequacy decisions by relevant authorities</li>
                            <li>Standard contractual clauses</li>
                            <li>Binding corporate rules</li>
                            <li>
                                Other legally recognized transfer mechanisms
                            </li>
                        </ul>
                    </div>
                </section>

                {/* 8. Data Retention */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        8. Data Retention
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            We retain your personal information for as long as
                            necessary to fulfill the purposes outlined in this
                            Privacy Policy, unless a longer retention period is
                            required by law.
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                Account information: Until account deletion plus
                                7 years for legal compliance
                            </li>
                            <li>
                                Transaction records: 7 years for financial and
                                tax purposes
                            </li>
                            <li>
                                Marketing data: Until you opt-out plus 2 years
                            </li>
                            <li>Analytics data: Anonymized after 2 years</li>
                            <li>
                                <strong>Wallet credentials:</strong> Immediately
                                and permanently deleted upon user backup
                                completion.{" "}
                                <strong>NO LONG-TERM STORAGE.</strong>
                                Temporary storage only for user convenience
                                until backup is completed.
                            </li>
                        </ul>
                    </div>
                </section>

                {/* 9. Cookies and Tracking */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        9. Cookies and Tracking Technologies
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            We use cookies and similar tracking technologies to
                            enhance your experience on our Services:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong>Essential Cookies:</strong> Necessary
                                for basic functionality
                            </li>
                            <li>
                                <strong>Performance Cookies:</strong> Help us
                                analyze usage and improve performance
                            </li>
                            <li>
                                <strong>Functional Cookies:</strong> Enable
                                enhanced features and personalization
                            </li>
                            <li>
                                <strong>Marketing Cookies:</strong> Used for
                                advertising and marketing purposes
                            </li>
                        </ul>
                        <p>
                            You can control cookies through your browser
                            settings. However, disabling certain cookies may
                            limit your ability to use some features of our
                            Services.
                        </p>
                    </div>
                </section>

                {/* 10. Children's Privacy */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        {`10. Children's Privacy`}
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            Our Services are not intended for children under the
                            age of 13. We do not knowingly collect personal
                            information from children under 13. If you believe
                            we have collected information from a child under 13,
                            please contact us immediately.
                        </p>
                    </div>
                </section>

                {/* 11. Updates to This Policy */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        11. Updates to This Policy
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            {`We may update this Privacy Policy from time to time.
                            We will notify you of any material changes by
                            posting the updated policy on our website and
                            updating the "Last Updated" date.`}
                        </p>
                        <p>
                            Your continued use of our Services after the
                            effective date of the updated policy constitutes
                            acceptance of the changes.
                        </p>
                    </div>
                </section>

                {/* 12. Contact Us */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        12. Contact Us
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            If you have any questions about this Privacy Policy
                            or our privacy practices, please contact us:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Email: contact@starglow.io</li>
                            <li>Website: starglow.io</li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
}
