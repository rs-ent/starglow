import React from "react";

export default function TermsOfService() {
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-white">
                    Terms of Service
                </h1>
                <p className="text-sm text-gray-400">
                    Last Updated: {new Date().toLocaleDateString("en-US")}
                </p>
            </div>

            <div className="space-y-8">
                {/* 1. Agreement */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        1. Agreement to Terms
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            {`These Terms of Service ("Terms") constitute a
                            legally binding agreement between you and Starglow
                            ("Company", "we", "us", or "our") regarding your use
                            of the Starglow platform and all related services
                            (collectively, the "Services").`}
                        </p>
                        <p>
                            By accessing or using our Services, you agree to be
                            bound by these Terms. If you do not agree to these
                            Terms, you may not access or use our Services.
                        </p>
                    </div>
                </section>

                {/* 2. Description of Services */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        2. Description of Services
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            Starglow is a Web3 entertainment platform that
                            connects K-pop artists with fans through:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>NFT creation, trading, and collection</li>
                            <li>Artist valuation and prediction markets</li>
                            <li>Fan community and engagement tools</li>
                            <li>Digital asset management</li>
                            <li>Blockchain-based entertainment experiences</li>
                            <li>Artist-fan interaction features</li>
                        </ul>
                    </div>
                </section>

                {/* 3. Eligibility */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        3. Eligibility
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>To use our Services, you must:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                Be at least 18 years old or the legal age of
                                majority in your jurisdiction
                            </li>
                            <li>
                                Have the legal capacity to enter into binding
                                agreements
                            </li>
                            <li>
                                Not be located in a jurisdiction where use of
                                our Services is prohibited
                            </li>
                            <li>
                                Comply with all applicable laws and regulations
                            </li>
                        </ul>
                    </div>
                </section>

                {/* 4. Account Registration */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        4. Account Registration and Security
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            To access certain features, you must create an
                            account. You agree to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                Provide accurate, current, and complete
                                information
                            </li>
                            <li>
                                Maintain the security of your account
                                credentials
                            </li>
                            <li>
                                Notify us immediately of any unauthorized use
                            </li>
                            <li>
                                Accept responsibility for all activities under
                                your account
                            </li>
                        </ul>
                    </div>
                </section>

                {/* 5. Web3 and Blockchain Services */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        5. Web3 and Blockchain Services
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <h3 className="text-lg font-medium text-gray-200">
                            5.1 Wallet Connection and Management
                        </h3>
                        <p>
                            You may connect third-party cryptocurrency wallets
                            or create wallets through our Services. You
                            understand and agree that:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong>Self-Custody Responsibility:</strong>{" "}
                                You are solely responsible for securing and
                                backing up your private keys immediately upon
                                wallet creation
                            </li>
                            <li>
                                <strong>Temporary Storage Notice:</strong> For
                                wallets created through our platform, we may
                                temporarily store encrypted credentials for
                                convenience purposes only.
                                <strong>
                                    YOU MUST BACKUP YOUR PRIVATE KEYS
                                    IMMEDIATELY
                                </strong>{" "}
                                to ensure full control and security of your
                                assets
                            </li>
                            <li>
                                <strong>Immediate Deletion:</strong> Upon
                                completing your backup, all stored credentials
                                are permanently deleted from our systems. We
                                cannot recover lost private keys after deletion
                            </li>
                            <li>
                                <strong>No Long-term Custody:</strong> We do not
                                provide long-term custodial wallet services. All
                                users must transition to self-custody
                                immediately
                            </li>
                            <li>
                                Transactions are irreversible once confirmed on
                                the blockchain
                            </li>
                            <li>
                                Network fees may apply to blockchain
                                transactions
                            </li>
                        </ul>

                        <h3 className="text-lg font-medium text-gray-200">
                            5.2 NFTs and Digital Assets
                        </h3>
                        <p>
                            When you purchase or create NFTs through our
                            Services:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                You obtain ownership rights to the specific NFT
                                token
                            </li>
                            <li>
                                Underlying content may be subject to separate
                                license terms
                            </li>
                            <li>
                                We do not guarantee the value or liquidity of
                                NFTs
                            </li>
                            <li>
                                Smart contract functionality may have
                                limitations
                            </li>
                        </ul>

                        <h3 className="text-lg font-medium text-gray-200">
                            5.3 Blockchain Risks
                        </h3>
                        <p>
                            You acknowledge the inherent risks of blockchain
                            technology, including:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Network congestion and transaction delays</li>
                            <li>Smart contract vulnerabilities</li>
                            <li>
                                Regulatory changes affecting blockchain services
                            </li>
                            <li>Potential loss of access to digital assets</li>
                        </ul>
                    </div>
                </section>

                {/* 6. User Conduct */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        6. User Conduct
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>You agree not to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Violate any laws or regulations</li>
                            <li>Infringe on intellectual property rights</li>
                            <li>Engage in fraudulent or deceptive practices</li>
                            <li>Harass, abuse, or harm other users</li>
                            <li>Distribute malware or harmful code</li>
                            <li>
                                Attempt to gain unauthorized access to our
                                systems
                            </li>
                            <li>Manipulate or exploit our Services</li>
                            <li>
                                Create multiple accounts to circumvent
                                restrictions
                            </li>
                        </ul>
                    </div>
                </section>

                {/* 7. Intellectual Property */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        7. Intellectual Property
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <h3 className="text-lg font-medium text-gray-200">
                            7.1 Our Content
                        </h3>
                        <p>
                            All content, features, and functionality of our
                            Services are owned by us or our licensors and are
                            protected by copyright, trademark, and other
                            intellectual property laws.
                        </p>

                        <h3 className="text-lg font-medium text-gray-200">
                            7.2 User Content
                        </h3>
                        <p>
                            You retain ownership of content you create or
                            upload. By using our Services, you grant us a
                            non-exclusive, royalty-free license to use, display,
                            and distribute your content in connection with our
                            Services.
                        </p>

                        <h3 className="text-lg font-medium text-gray-200">
                            7.3 Artist Content
                        </h3>
                        <p>
                            Artist content, including music, images, and videos,
                            is protected by copyright and may be subject to
                            separate licensing agreements with artists and
                            record labels.
                        </p>
                    </div>
                </section>

                {/* 8. Payment and Fees */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        8. Payment and Fees
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <h3 className="text-lg font-medium text-gray-200">
                            8.1 Payment Methods
                        </h3>
                        <p>We accept the following payment methods:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Credit and debit cards</li>
                            <li>Bank transfers and virtual accounts</li>
                            <li>
                                Mobile payment services (Samsung Pay, Apple Pay,
                                etc.)
                            </li>
                            <li>
                                Cryptocurrency payments (Bitcoin, Ethereum,
                                etc.)
                            </li>
                            <li>
                                Easy payment services (Naver Pay, Kakao Pay,
                                etc.)
                            </li>
                            <li>Other payment methods as made available</li>
                        </ul>

                        <h3 className="text-lg font-medium text-gray-200">
                            8.2 Payment Obligations
                        </h3>
                        <p>By making a payment, you agree to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Pay all applicable fees and taxes</li>
                            <li>Provide accurate payment information</li>
                            <li>Accept responsibility for all charges</li>
                            <li>Comply with payment processor terms</li>
                            <li>
                                Accept that cryptocurrency transactions are
                                irreversible
                            </li>
                        </ul>

                        <h3 className="text-lg font-medium text-gray-200">
                            8.3 Digital Assets and NFTs
                        </h3>
                        <p>
                            Purchases of digital assets, NFTs, and virtual items
                            are:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Final and non-refundable</li>
                            <li>Subject to blockchain network fees</li>
                            <li>Delivered to your connected wallet address</li>
                            <li>Your responsibility to secure and maintain</li>
                        </ul>

                        <h3 className="text-lg font-medium text-gray-200">
                            8.4 No Refund Policy
                        </h3>
                        <p>
                            <strong>ALL SALES ARE FINAL.</strong> Due to the
                            digital nature of our Services and the irreversible
                            nature of blockchain transactions, we do not offer
                            refunds, returns, or exchanges for any purchases,
                            including but not limited to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>NFTs and digital collectibles</li>
                            <li>Virtual currencies and tokens</li>
                            <li>Digital content and premium features</li>
                            <li>Event tickets and participation fees</li>
                            <li>Subscription services</li>
                        </ul>

                        <h3 className="text-lg font-medium text-gray-200">
                            8.5 Fee Changes
                        </h3>
                        <p>
                            We reserve the right to modify our fees at any time
                            with reasonable notice. Price changes will not
                            affect purchases already completed.
                        </p>

                        <h3 className="text-lg font-medium text-gray-200">
                            8.6 Taxes
                        </h3>
                        <p>
                            You are responsible for all applicable taxes related
                            to your use of our Services and any transactions
                            conducted through our platform.
                        </p>
                    </div>
                </section>

                {/* 9. Privacy and Data Protection */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        9. Privacy and Data Protection
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            Your privacy is important to us. Our collection and
                            use of personal information is governed by our
                            Privacy Policy, which is incorporated into these
                            Terms by reference.
                        </p>
                    </div>
                </section>

                {/* 10. Disclaimers */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        10. Disclaimers
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            {`OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE"
                            WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL
                            WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT
                            LIMITED TO:`}
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                MERCHANTABILITY AND FITNESS FOR A PARTICULAR
                                PURPOSE
                            </li>
                            <li>NON-INFRINGEMENT AND TITLE</li>
                            <li>
                                ACCURACY, COMPLETENESS, OR RELIABILITY OF
                                CONTENT
                            </li>
                            <li>UNINTERRUPTED OR ERROR-FREE OPERATION</li>
                        </ul>
                    </div>
                </section>

                {/* 11. Limitation of Liability */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        11. Limitation of Liability
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT
                            BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                            CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT
                            NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE,
                            ARISING OUT OF OR RELATING TO YOUR USE OF OUR
                            SERVICES.
                        </p>
                        <p>
                            OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU
                            PAID TO US IN THE TWELVE MONTHS PRECEDING THE CLAIM.
                        </p>
                    </div>
                </section>

                {/* 12. Indemnification */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        12. Indemnification
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            You agree to indemnify and hold us harmless from any
                            claims, damages, or expenses arising from your use
                            of our Services, violation of these Terms, or
                            infringement of any third-party rights.
                        </p>
                    </div>
                </section>

                {/* 13. Termination */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        13. Termination
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            We may terminate or suspend your access to our
                            Services at any time, with or without cause, with or
                            without notice. You may also terminate your account
                            at any time.
                        </p>
                        <p>
                            Upon termination, your right to use our Services
                            ceases immediately. Provisions that should survive
                            termination will remain in effect.
                        </p>
                    </div>
                </section>

                {/* 14. Changes to Terms */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        14. Changes to Terms
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            {`We reserve the right to modify these Terms at any
                            time. We will notify you of material changes by
                            posting the updated Terms on our website and
                            updating the "Last Updated" date.`}
                        </p>
                        <p>
                            Your continued use of our Services after the
                            effective date constitutes acceptance of the updated
                            Terms.
                        </p>
                    </div>
                </section>

                {/* 15. Contact Information */}
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-white">
                        15. Contact Information
                    </h2>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            If you have any questions about these Terms, please
                            contact us:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Email: contact@starglow.io</li>
                            <li>Website: starglow.io</li>
                            <li>Telegram: @starglow_support</li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
}
