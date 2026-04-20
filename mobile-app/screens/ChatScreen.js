import {
    View, Text, ScrollView, TextInput,
    TouchableOpacity, StatusBar, ActivityIndicator,
    KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import { getPropertyImage } from '../utils/propertyImages';
import PropertyDetail from '../components/PropertyDetail';

const PRIMARY = '#1A1265';
const GOLD = '#C9A84C';
const GOLD_DIM = '#C9A84C20';
const CREAM = '#F9F8FF';

// ─── Suggested Questions ──────────────────────────────────────────────────────
const SUGGESTED_QUESTIONS = [
    "What are the best areas to invest in Cairo?",
    "Compare New Cairo vs Sheikh Zayed for apartments",
    "What's the average rental yield in Maadi?",
    "Find me 3-bedroom villas under 5M EGP",
    "Is now a good time to invest in Egyptian real estate?",
    "What's the difference between townhouse and twin house?",
];

// ─── Property Mini Card ────────────────────────────────────────────────────────
const PropertyMiniCard = ({ property, onPress }) => {
    const imageUri = getPropertyImage(property.property_id, property.type || property.property_type);
    const priceM = ((property.price || 0) / 1_000_000).toFixed(1);

    return (
        <TouchableOpacity
            onPress={() => onPress(property)}
            activeOpacity={0.88}
            style={{
                width: 160, marginRight: 10,
                borderRadius: 14, backgroundColor: '#fff',
                overflow: 'hidden',
                borderWidth: 1, borderColor: '#ECEAF5',
                shadowColor: PRIMARY, shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
            }}
        >
            <Image
                source={{ uri: imageUri }}
                style={{ width: '100%', height: 90 }}
                resizeMode="cover"
            />
            {/* "View" pill overlay */}
            <View style={{
                position: 'absolute', top: 8, right: 8,
                backgroundColor: 'rgba(0,0,0,0.45)',
                borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
            }}>
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
                    VIEW →
                </Text>
            </View>
            <View style={{ padding: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: PRIMARY, marginBottom: 2 }} numberOfLines={1}>
                    {property.city || 'Egypt'}
                </Text>
                <Text style={{ fontSize: 10, color: '#999', marginBottom: 4 }} numberOfLines={1}>
                    {property.neighborhood || property.type || 'Property'}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: GOLD }}>
                    {priceM}M EGP
                </Text>
                {property.bedrooms ? (
                    <Text style={{ fontSize: 10, color: '#BBB', marginTop: 2 }}>
                        🛏 {property.bedrooms} bed • 🛁 {property.bathrooms} bath
                    </Text>
                ) : null}
            </View>
        </TouchableOpacity>
    );
};

// ─── Message Bubble ────────────────────────────────────────────────────────────
const MessageBubble = ({ message, onPropertyPress }) => {
    const isUser = message.role === 'user';

    return (
        <View style={{ marginBottom: 16 }}>
            <View style={{
                flexDirection: 'row',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                marginBottom: message.properties?.length > 0 ? 8 : 0,
            }}>
                {/* AI Avatar */}
                {!isUser && (
                    <View style={{
                        width: 30, height: 30, borderRadius: 15,
                        backgroundColor: PRIMARY,
                        justifyContent: 'center', alignItems: 'center',
                        marginRight: 8, marginBottom: 2,
                    }}>
                        <Text style={{ fontSize: 14 }}>🤖</Text>
                    </View>
                )}

                {/* Bubble */}
                <View style={{
                    maxWidth: '78%',
                    backgroundColor: isUser ? PRIMARY : '#fff',
                    borderRadius: 18,
                    borderBottomRightRadius: isUser ? 4 : 18,
                    borderBottomLeftRadius: isUser ? 18 : 4,
                    paddingHorizontal: 14, paddingVertical: 10,
                    borderWidth: isUser ? 0 : 1,
                    borderColor: '#ECEAF5',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
                }}>
                    <Text style={{
                        fontSize: 14, lineHeight: 21,
                        color: isUser ? '#fff' : PRIMARY,
                    }}>
                        {message.content}
                    </Text>
                </View>

                {/* User Avatar */}
                {isUser && (
                    <View style={{
                        width: 30, height: 30, borderRadius: 15,
                        backgroundColor: GOLD,
                        justifyContent: 'center', alignItems: 'center',
                        marginLeft: 8, marginBottom: 2,
                    }}>
                        <Text style={{ fontSize: 14 }}>👤</Text>
                    </View>
                )}
            </View>

            {/* Property Cards below AI message */}
            {!isUser && message.properties?.length > 0 && (
                <View style={{ marginLeft: 38 }}>
                    <Text style={{
                        fontSize: 10, fontWeight: '700', color: '#AAA',
                        letterSpacing: 1, marginBottom: 8,
                    }}>
                        RELEVANT PROPERTIES
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                    >
                        {message.properties.map((prop) => (
                            <PropertyMiniCard
                                key={prop.property_id}
                                property={prop}
                                onPress={onPropertyPress}
                            />
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

// ─── Typing Indicator ──────────────────────────────────────────────────────────
const TypingIndicator = () => (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 }}>
        <View style={{
            width: 30, height: 30, borderRadius: 15,
            backgroundColor: PRIMARY,
            justifyContent: 'center', alignItems: 'center',
            marginRight: 8,
        }}>
            <Text style={{ fontSize: 14 }}>🤖</Text>
        </View>
        <View style={{
            backgroundColor: '#fff', borderRadius: 18, borderBottomLeftRadius: 4,
            paddingHorizontal: 16, paddingVertical: 12,
            borderWidth: 1, borderColor: '#ECEAF5',
            flexDirection: 'row', alignItems: 'center', gap: 4,
        }}>
            {[0, 1, 2].map((i) => (
                <View key={i} style={{
                    width: 6, height: 6, borderRadius: 3,
                    backgroundColor: GOLD, opacity: 0.6 + i * 0.2,
                }} />
            ))}
        </View>
    </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ChatScreen({ navigation }) {
    const { user } = useAuth();

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const scrollRef = useRef(null);

    const handlePropertyPress = (property) => {
        setSelectedProperty(property);
        setDetailOpen(true);
    };

    // Scroll to bottom when messages update
    useEffect(() => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, [messages, loading]);

    const sendMessage = async (text) => {
        const messageText = text || input.trim();
        if (!messageText || loading) return;

        setInput('');

        // Add user message
        const userMsg = { role: 'user', content: messageText };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setLoading(true);

        // Call backend
        const result = await chatService.ask({
            message: messageText,
            history: messages,
        });

        if (result.success) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: result.data.response,
                properties: result.data.properties || [],
            }]);
        } else {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please check your connection and try again.",
                properties: [],
            }]);
        }
        setLoading(false);
    };

    const clearChat = () => setMessages([]);

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: CREAM }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

            {/* Header */}
            <View style={{
                backgroundColor: PRIMARY,
                paddingTop: (StatusBar.currentHeight || 44) + 12,
                paddingBottom: 16, paddingHorizontal: 20,
            }}>
                <Text style={{ color: GOLD, fontSize: 10, fontWeight: '800', letterSpacing: 2.5, marginBottom: 12 }}>
                    PROPERTY PRO
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>AI Assistant 🤖</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 }}>
                            Ask anything about Egyptian real estate
                        </Text>
                    </View>
                    {messages.length > 0 && (
                        <TouchableOpacity
                            onPress={clearChat}
                            style={{
                                paddingHorizontal: 12, paddingVertical: 6,
                                borderRadius: 20, borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.2)',
                            }}
                        >
                            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Clear</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Messages */}
            <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Empty state — suggested questions */}
                {messages.length === 0 && (
                    <View style={{ alignItems: 'center', paddingTop: 20, paddingBottom: 24 }}>
                        {/* AI intro card */}
                        <View style={{
                            backgroundColor: PRIMARY, borderRadius: 20,
                            padding: 20, marginBottom: 24, width: '100%',
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                <View style={{
                                    width: 40, height: 40, borderRadius: 20,
                                    backgroundColor: GOLD,
                                    justifyContent: 'center', alignItems: 'center',
                                    marginRight: 12,
                                }}>
                                    <Text style={{ fontSize: 20 }}>🤖</Text>
                                </View>
                                <View>
                                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
                                        PropertyPro AI
                                    </Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                                        Powered by GPT-4o-mini
                                    </Text>
                                </View>
                            </View>
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 20 }}>
                                Hi {user?.full_name?.split(' ')[0] || 'there'}! I can help you find properties,
                                analyze investments, and answer any questions about the Egyptian real estate market.
                                I have access to 18,963 properties across Egypt.
                            </Text>
                        </View>

                        <Text style={{
                            fontSize: 10, fontWeight: '800', color: '#BCBAD0',
                            letterSpacing: 1.8, marginBottom: 14, alignSelf: 'flex-start',
                        }}>
                            SUGGESTED QUESTIONS
                        </Text>

                        {SUGGESTED_QUESTIONS.map((q) => (
                            <TouchableOpacity
                                key={q}
                                onPress={() => sendMessage(q)}
                                activeOpacity={0.75}
                                style={{
                                    width: '100%', backgroundColor: '#fff',
                                    borderRadius: 14, padding: 14, marginBottom: 10,
                                    borderWidth: 1, borderColor: '#ECEAF5',
                                    flexDirection: 'row', alignItems: 'center',
                                    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
                                }}
                            >
                                <Text style={{ fontSize: 16, marginRight: 12 }}>💬</Text>
                                <Text style={{ flex: 1, fontSize: 13, color: PRIMARY, fontWeight: '500', lineHeight: 19 }}>
                                    {q}
                                </Text>
                                <Text style={{ color: GOLD, fontSize: 16 }}>›</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Chat messages */}
                {messages.map((msg, i) => (
                    <MessageBubble key={i} message={msg} onPropertyPress={handlePropertyPress} />
                ))}

                {/* Typing indicator */}
                {loading && <TypingIndicator />}
            </ScrollView>

            {/* Input bar */}
            <View style={{
                flexDirection: 'row', alignItems: 'flex-end',
                paddingHorizontal: 16, paddingVertical: 12,
                paddingBottom: Platform.OS === 'ios' ? 24 : 12,
                backgroundColor: '#fff',
                borderTopWidth: 1, borderTopColor: '#ECEAF5',
                gap: 10,
            }}>
                <View style={{
                    flex: 1, backgroundColor: CREAM,
                    borderRadius: 22, borderWidth: 1, borderColor: '#ECEAF5',
                    paddingHorizontal: 16, paddingVertical: 10,
                    minHeight: 44, justifyContent: 'center',
                }}>
                    <TextInput
                        style={{ fontSize: 14, color: PRIMARY, maxHeight: 100 }}
                        placeholder="Ask about properties, yields, areas..."
                        placeholderTextColor="#BBB"
                        value={input}
                        onChangeText={setInput}
                        multiline
                        returnKeyType="send"
                        onSubmitEditing={() => sendMessage()}
                        blurOnSubmit={false}
                    />
                </View>

                <TouchableOpacity
                    onPress={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    activeOpacity={0.85}
                    style={{
                        width: 44, height: 44, borderRadius: 22,
                        backgroundColor: input.trim() && !loading ? GOLD : '#E0E0E0',
                        justifyContent: 'center', alignItems: 'center',
                    }}
                >
                    {loading
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={{ fontSize: 18 }}>↑</Text>
                    }
                </TouchableOpacity>
            </View>
            {/* Property Detail Modal — opened when a chat card is tapped */}
            <PropertyDetail
                visible={detailOpen}
                property={selectedProperty}
                similarProperties={[]}
                onClose={() => {
                    setDetailOpen(false);
                    setTimeout(() => setSelectedProperty(null), 300);
                }}
            />

        </KeyboardAvoidingView>
    );
}