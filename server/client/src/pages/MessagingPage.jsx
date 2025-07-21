import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, ListGroup, InputGroup } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaPaperPlane, FaEnvelopeOpenText, FaUser, FaPhone, FaMapMarkerAlt, FaClock, FaTag } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://dorm-deals-network-1e67636e46cd.herokuapp.com'
  : 'http://localhost:5000';

const MessagingPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarInfo, setSidebarInfo] = useState({ otherUser: null, item: null });
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    fetchConversations().then(() => {
      const params = new URLSearchParams(location.search);
      const sellerId = params.get('sellerId');
      const itemId = params.get('itemId');
      if (sellerId) {
        // Try to find the conversation or create a temp one
        let conv = null;
        if (itemId) {
          conv = conversations.find(c => String(c.other_user_id) === String(sellerId) && String(c.item_id) === String(itemId));
        } else {
          conv = conversations.find(c => String(c.other_user_id) === String(sellerId));
        }
        if (conv) {
          setSelectedConv(conv);
        } else {
          // If no conversation exists, create a temp one for UI
          setSelectedConv({
            other_user_id: Number(sellerId),
            item_id: itemId ? Number(itemId) : null,
            other_user_name: '',
            other_user_profile_image_url: '',
            content: '',
          });
        }
      }
    });
    // eslint-disable-next-line
  }, [location.search]);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.other_user_id, selectedConv.item_id);
    }
    // eslint-disable-next-line
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch sidebar info when selectedConv changes
  useEffect(() => {
    const fetchSidebarInfo = async () => {
      if (!selectedConv) return;
      let otherUser = null;
      let item = null;
      try {
        if (selectedConv.other_user_id) {
          console.log('Fetching other user info for user ID:', selectedConv.other_user_id);
          // Fetch other user info directly from user endpoint
          const res = await axios.get(`${apiUrl}/api/users/${selectedConv.other_user_id}`);
          console.log('Other user API response:', res.data);
          otherUser = {
            id: res.data.id,
            name: res.data.name || res.data.username || res.data.email || '',
            profile_image_url: res.data.profile_image_url || '',
            university_name: res.data.university_name || '',
          };
          console.log('Processed other user info:', otherUser);
        }
        if (selectedConv.item_id) {
          console.log('Fetching item info for item ID:', selectedConv.item_id);
          const res = await axios.get(`${apiUrl}/api/items/${selectedConv.item_id}`);
          item = res.data;
          console.log('Item info:', item);
        }
      } catch (e) {
        console.log('Error fetching sidebar info:', e);
      }
      console.log('Setting sidebar info:', { otherUser, item });
      setSidebarInfo({ otherUser, item });
    };
    fetchSidebarInfo();
    // eslint-disable-next-line
  }, [selectedConv]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/api/my-conversations`);
      setConversations(res.data);
    } catch (err) {
      setError('Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId, itemId) => {
    setMsgLoading(true);
    try {
      const params = { user2: otherUserId };
      if (itemId) params.item_id = itemId;
      const res = await axios.get(`${apiUrl}/api/messages`, { params });
      setMessages(res.data);
      // Mark as read
      await axios.post(`${apiUrl}/api/messages/mark-read`, {
        other_user_id: otherUserId,
        item_id: itemId
      });
    } catch (err) {
      setError('Failed to load messages.');
    } finally {
      setMsgLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConv) return;
    try {
      await axios.post(`${apiUrl}/api/messages`, {
        receiver_id: selectedConv.other_user_id,
        item_id: selectedConv.item_id,
        content: messageText.trim()
      });
      setMessageText('');
      fetchMessages(selectedConv.other_user_id, selectedConv.item_id);
      fetchConversations();
      // If temp conversation, refresh conversations and select the new one
      if (!selectedConv.other_user_name) {
        setTimeout(fetchConversations, 500);
      }
    } catch (err) {
      setError('Failed to send message.');
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-3">
        <Col>
          <Button as={Link} to="/dashboard" variant="outline-secondary">
            <FaArrowLeft className="me-2" />Back to Dashboard
          </Button>
        </Col>
      </Row>
      <h2 className="mb-4"><FaEnvelopeOpenText className="me-2" />Messages</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row>
        <Col md={4} className="mb-3">
          <Card>
            <Card.Header>Conversations</Card.Header>
            <ListGroup variant="flush">
              {conversations.length === 0 && <ListGroup.Item>No conversations yet.</ListGroup.Item>}
              {conversations.map((conv, idx) => (
                <ListGroup.Item
                  key={conv.id || idx}
                  action
                  active={selectedConv && conv.other_user_id === selectedConv.other_user_id && conv.item_id === selectedConv.item_id}
                  onClick={() => setSelectedConv(conv)}
                  className="d-flex align-items-center"
                >
                  {conv.other_user_profile_image_url && (
                    <img src={conv.other_user_profile_image_url} alt="profile" width={32} height={32} className="rounded-circle me-2" />
                  )}
                  <div>
                    <div className="fw-bold">{conv.other_user_name}</div>
                    {conv.item_id && <div className="small text-muted">Item #{conv.item_id}</div>}
                    <div className="small text-muted">{conv.content?.slice(0, 30)}...</div>
                    {conv.is_read === false && conv.receiver_id === user.id && (
                      <span className="badge bg-danger ms-2">New</span>
                    )}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
          {/* Sidebar info for other user and item */}
          {(sidebarInfo.otherUser || sidebarInfo.item) && (
            <Card className="mt-3">
              <Card.Header>Conversation Info</Card.Header>
              <Card.Body>
                {sidebarInfo.otherUser && (
                  <div className="mb-3">
                    <div className="fw-bold mb-1">
                      <FaUser className="me-2" />
                      {/* Determine the role based on who owns the item */}
                      {sidebarInfo.item && sidebarInfo.item.user_id === sidebarInfo.otherUser.id 
                        ? 'Seller' 
                        : sidebarInfo.item && sidebarInfo.item.user_id === user.id
                        ? 'Interested Buyer'
                        : 'Contact'}
                    </div>
                    {sidebarInfo.otherUser.profile_image_url && (
                      <img src={sidebarInfo.otherUser.profile_image_url} alt="profile" width={40} height={40} className="rounded-circle mb-2 d-block" />
                    )}
                    <div>{sidebarInfo.otherUser.name}</div>
                    {sidebarInfo.otherUser.university_name && (
                      <div className="text-muted small"><FaMapMarkerAlt className="me-1" />{sidebarInfo.otherUser.university_name}</div>
                    )}
                  </div>
                )}
                {sidebarInfo.item && (
                  <div>
                    <div className="fw-bold mb-1"><FaTag className="me-2" />Item</div>
                    <div>{sidebarInfo.item.title}</div>
                    <div className="text-muted small">Category: {sidebarInfo.item.category}</div>
                    <div className="text-muted small">Price: ${sidebarInfo.item.price}</div>
                    <div className="text-muted small">Condition: {sidebarInfo.item.condition}</div>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
        <Col md={8}>
          {selectedConv ? (
            <Card className="h-100">
              <Card.Header>
                <div className="d-flex align-items-center">
                  {selectedConv.other_user_profile_image_url && (
                    <img src={selectedConv.other_user_profile_image_url} alt="profile" width={32} height={32} className="rounded-circle me-2" />
                  )}
                  <div>
                    <div className="fw-bold">{selectedConv.other_user_name}</div>
                    {selectedConv.item_id && (
                      <div className="small text-muted">
                        {sidebarInfo.item?.title || 'Loading title...'}
                      </div>
                    )}
                  </div>
                </div>
              </Card.Header>
              <Card.Body style={{ maxHeight: 400, overflowY: 'auto', background: '#f8f9fa' }}>
                {msgLoading ? (
                  <Spinner animation="border" />
                ) : (
                  messages.length === 0 ? (
                    <div className="text-center text-muted">No messages yet.</div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className={`mb-2 d-flex ${msg.sender_id === user.id ? 'justify-content-end' : 'justify-content-start'}`}>
                        <div className={`p-2 rounded ${msg.sender_id === user.id ? 'bg-primary text-white' : 'bg-light border'}`} style={{ maxWidth: '70%' }}>
                          {msg.content}
                          <div className="small text-end text-muted mt-1" style={{ fontSize: '0.75em' }}>{new Date(msg.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                    ))
                  )
                )}
                <div ref={messagesEndRef} />
              </Card.Body>
              <Card.Footer>
                <Form onSubmit={handleSend} className="d-flex">
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      disabled={msgLoading}
                    />
                    <Button type="submit" variant="primary" disabled={msgLoading || !messageText.trim()}>
                      <FaPaperPlane />
                    </Button>
                  </InputGroup>
                </Form>
              </Card.Footer>
            </Card>
          ) : (
            <div className="text-center text-muted mt-5">Select a conversation to view messages.</div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default MessagingPage;
