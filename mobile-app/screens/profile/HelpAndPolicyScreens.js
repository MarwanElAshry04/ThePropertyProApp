// ─── HelpSupportScreen.js ─────────────────────────────────────────────────────
import {
    View, Text, TouchableOpacity, ScrollView,
    StatusBar, Linking,
} from 'react-native';

const PRIMARY = '#1A1265';
const GOLD = '#C9A84C';
const CREAM = '#F9F8FF';

const FAQItem = ({ q, a }) => (
    <View style={{
        backgroundColor: '#fff', borderRadius: 14, padding: 16,
        marginBottom: 12, borderWidth: 1, borderColor: '#ECEAF5',
    }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: PRIMARY, marginBottom: 6 }}>{q}</Text>
        <Text style={{ fontSize: 13, color: '#777', lineHeight: 20 }}>{a}</Text>
    </View>
);

export function HelpSupportScreen({ navigation }) {
    return (
        <View style={{ flex: 1, backgroundColor: CREAM }}>
            <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
            <View style={{
                backgroundColor: PRIMARY,
                paddingTop: (StatusBar.currentHeight || 44) + 12,
                paddingBottom: 20, paddingHorizontal: 20,
                flexDirection: 'row', alignItems: 'center',
            }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                    <Text style={{ color: '#fff', fontSize: 24 }}>←</Text>
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Help & Support</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#BCBAD0', letterSpacing: 1.8, marginBottom: 16 }}>
                    FREQUENTLY ASKED QUESTIONS
                </Text>

                <FAQItem
                    q="How does the AI recommendation work?"
                    a="PropertyPro uses Sentence-BERT semantic embeddings to understand the meaning of your search, then matches it against 18,963 Egyptian properties using a hybrid search algorithm combining semantic similarity and database filters."
                />
                <FAQItem
                    q="What does the match percentage mean?"
                    a="The match percentage shows how closely a property matches your search query and preferences. 90%+ means an excellent match. It's calculated using cosine similarity between your query's embedding and the property's embedding."
                />
                <FAQItem
                    q="Are the investment analysis estimates accurate?"
                    a="Investment analysis figures (rental yield, ROI estimates) are based on Egyptian real estate market averages and should be used as guidance only. Always consult a professional advisor before investing."
                />
                <FAQItem
                    q="How do I reset my password?"
                    a="Tap 'Forgot password?' on the Sign In screen. Enter your email and you'll receive a 6-digit reset code. Codes expire after 15 minutes."
                />
                <FAQItem
                    q="Why can't I sign in with Google?"
                    a="Google Sign-In requires a production app build. During development, please use email and password to sign in."
                />

                <Text style={{ fontSize: 10, fontWeight: '800', color: '#BCBAD0', letterSpacing: 1.8, marginTop: 24, marginBottom: 16 }}>
                    CONTACT
                </Text>
                <TouchableOpacity
                    onPress={() => Linking.openURL('mailto:marwanyy13@gmail.com')}
                    style={{
                        backgroundColor: PRIMARY, borderRadius: 14, padding: 16,
                        flexDirection: 'row', alignItems: 'center',
                    }}
                >
                    <Text style={{ fontSize: 20, marginRight: 14 }}>✉️</Text>
                    <View>
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Email Support</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 }}>marwanyy13@gmail.com</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

// ─── PolicyScreen.js ──────────────────────────────────────────────────────────
const PRIVACY_CONTENT = `PropertyPro Privacy Policy
Last updated: April 2026

1. Information We Collect
We collect information you provide when creating an account (name, email, investment preferences) and information about how you use the app (searches, saved properties).

2. How We Use Your Information
We use your information to provide personalized property recommendations, improve our AI models, and communicate with you about your account.

3. Data Storage
Your data is stored securely on our servers in Egypt. Passwords are hashed using bcrypt and are never stored in plain text. Authentication tokens are stored encrypted on your device.

4. Data Sharing
We do not sell your personal information to third parties. We may share anonymized, aggregated data for research purposes.

5. Your Rights
You can request deletion of your account and all associated data by contacting our support team.

6. Contact
For privacy-related inquiries: marwanyy13@gmail.com`;

const TERMS_CONTENT = `PropertyPro Terms of Service
Last updated: April 2026

1. Acceptance of Terms
By using PropertyPro, you agree to these terms of service.

2. Use of the App
PropertyPro is intended for informational and investment research purposes. All property recommendations and investment analyses are estimates and should not be considered financial advice.

3. User Accounts
You are responsible for maintaining the security of your account credentials. Do not share your password with others.

4. Investment Disclaimer
PropertyPro does not provide licensed financial advice. All investment analysis figures (rental yield, ROI estimates, appreciation projections) are based on market averages and are for reference only. Always consult a qualified financial advisor before making investment decisions.

5. Intellectual Property
The PropertyPro app, its AI models, and all associated content are the intellectual property of the development team.

6. Limitation of Liability
PropertyPro is not liable for any investment decisions made based on information provided by the app.

7. Contact
For terms-related inquiries: marwanyy13@gmail.com`;

export function PolicyScreen({ navigation, route }) {
    const type = route.params?.type || 'privacy';
    const title = type === 'privacy' ? 'Privacy Policy' : 'Terms of Service';
    const content = type === 'privacy' ? PRIVACY_CONTENT : TERMS_CONTENT;

    return (
        <View style={{ flex: 1, backgroundColor: CREAM }}>
            <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
            <View style={{
                backgroundColor: PRIMARY,
                paddingTop: (StatusBar.currentHeight || 44) + 12,
                paddingBottom: 20, paddingHorizontal: 20,
                flexDirection: 'row', alignItems: 'center',
            }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                    <Text style={{ color: '#fff', fontSize: 24 }}>←</Text>
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{title}</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={{ fontSize: 14, color: '#555', lineHeight: 24 }}>
                    {content}
                </Text>
            </ScrollView>
        </View>
    );
}