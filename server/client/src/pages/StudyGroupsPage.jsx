import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Nav, Tab, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaPlus, FaCalendar, FaMapMarkerAlt, FaUser, FaEdit, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const StudyGroupsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('browse');
  const [studyGroups, setStudyGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [connectionError, setConnectionError] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isWakingUp, setIsWakingUp] = useState(false);
  
  const { user } = useAuth();
  const apiUrl = process.env.NODE_ENV === 'production'
    ? 'https://dorm-deals-network-1e67636e46cd.herokuapp.com'
    : 'http://localhost:5000';

  // Request throttling - minimum 2 seconds between requests
  const MIN_REQUEST_INTERVAL = 2000;
  const MAX_RETRIES = 3;
  
  // Timeout settings - longer for production (Heroku cold starts)
  const REQUEST_TIMEOUT = process.env.NODE_ENV === 'production' ? 30000 : 10000;

  // Form state for creating new group
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    description: '',
    schedule: '',
    location: '',
    max_members: 8
  });

  useEffect(() => {
    // Prevent infinite loops by throttling requests
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      console.log('Request throttled - waiting for cooldown');
      return;
    }

    // Don't retry if we've exceeded max retries and have a connection error
    if (connectionError && retryCount >= MAX_RETRIES) {
      console.log('Max retries exceeded - not attempting new request');
      setLoading(false);
      return;
    }

    setLastRequestTime(now);
    
    const loadData = async () => {
      try {
        setConnectionError(false);
        setIsWakingUp(true);
        await fetchStudyGroups();
        if (user) {
          await fetchMyGroups();
        }
        setRetryCount(0); // Reset retry count on success
        setIsWakingUp(false);
      } catch (error) {
        console.error('Error in useEffect loadData:', error);
        setConnectionError(true);
        setRetryCount(prev => prev + 1);
        setIsWakingUp(false);
      }
    };

    loadData();
  }, []); // Remove user dependency to prevent infinite loops

  const fetchStudyGroups = async () => {
    try {
      setError(''); // Clear previous errors
      const response = await axios.get(`${apiUrl}/api/study-groups`, {
        timeout: REQUEST_TIMEOUT
      });
      setStudyGroups(response.data);
      setConnectionError(false);
    } catch (error) {
      console.error('Error fetching study groups:', error);
      
      if (error.code === 'ECONNABORTED') {
        setConnectionError(true);
        if (process.env.NODE_ENV === 'production') {
          setError('Server is taking longer than expected to respond. This might be due to a cold start - please try again.');
        } else {
          setError('Request timed out. Please try again.');
        }
      } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR' || !error.response) {
        setConnectionError(true);
        setError('Unable to connect to server. Please check if the backend is running.');
      } else {
        setError('Failed to load study groups');
      }
      
      // Don't throw the error to prevent useEffect from re-triggering
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`${apiUrl}/api/study-groups/my-groups/${user.id}`, {
        timeout: REQUEST_TIMEOUT
      });
      setMyGroups(response.data);
    } catch (error) {
      console.error('Error fetching my groups:', error);
      
      if (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR' || !error.response) {
        setConnectionError(true);
      }
      // Don't set error state for my groups to avoid UI confusion
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to create a study group');
      return;
    }

    try {
      const groupData = {
        ...formData,
        creator_id: user.id
      };
      
      await axios.post(`${apiUrl}/api/study-groups`, groupData, {
        timeout: REQUEST_TIMEOUT
      });
      setSuccess('Study group created successfully!');
      setShowCreateModal(false);
      setFormData({
        name: '',
        subject: '',
        description: '',
        schedule: '',
        location: '',
        max_members: 8
      });
      
      // Refresh the lists only if not in connection error state
      if (!connectionError) {
        fetchStudyGroups();
        if (user) fetchMyGroups();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error creating study group:', error);
      if (error.code === 'ECONNABORTED') {
        setConnectionError(true);
        setError('Request timed out. The server may be starting up - please try again.');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR' || !error.response) {
        setConnectionError(true);
        setError('Unable to connect to server. Please try again later.');
      } else {
        setError('Failed to create study group');
      }
    }
  };

  const handleJoinGroup = async (groupId) => {
    if (!user) {
      setError('Please log in to join a study group');
      return;
    }

    try {
      await axios.post(`${apiUrl}/api/study-groups/${groupId}/join`, {}, {
        timeout: REQUEST_TIMEOUT
      });
      setSuccess('Successfully joined the study group!');
      
      // Refresh the lists only if not in connection error state
      if (!connectionError) {
        fetchStudyGroups();
        if (user) fetchMyGroups();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error joining study group:', error);
      if (error.code === 'ECONNABORTED') {
        setConnectionError(true);
        setError('Request timed out. Please try again.');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR' || !error.response) {
        setConnectionError(true);
        setError('Unable to connect to server. Please try again later.');
      } else if (error.response?.status === 400) {
        setError(error.response.data.message || 'Unable to join study group');
      } else {
        setError('Failed to join study group');
      }
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!user) {
      setError('Please log in to leave a study group');
      return;
    }

    try {
      await axios.post(`${apiUrl}/api/study-groups/${groupId}/leave`, {}, {
        timeout: REQUEST_TIMEOUT
      });
      setSuccess('Successfully left the study group!');
      
      // Refresh the lists only if not in connection error state
      if (!connectionError) {
        fetchStudyGroups();
        if (user) fetchMyGroups();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error leaving study group:', error);
      if (error.code === 'ECONNABORTED') {
        setConnectionError(true);
        setError('Request timed out. Please try again.');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR' || !error.response) {
        setConnectionError(true);
        setError('Unable to connect to server. Please try again later.');
      } else {
        setError('Failed to leave study group');
      }
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!user) {
      setError('Please log in to delete a study group');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this study group?')) {
      return;
    }

    try {
      await axios.delete(`${apiUrl}/api/study-groups/${groupId}`, {
        timeout: REQUEST_TIMEOUT
      });
      setSuccess('Study group deleted successfully!');
      
      // Refresh the lists only if not in connection error state
      if (!connectionError) {
        fetchStudyGroups();
        if (user) fetchMyGroups();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting study group:', error);
      if (error.code === 'ECONNABORTED') {
        setConnectionError(true);
        setError('Request timed out. Please try again.');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR' || !error.response) {
        setConnectionError(true);
        setError('Unable to connect to server. Please try again later.');
      } else if (error.response?.status === 403) {
        setError('Only the group creator can delete this group');
      } else {
        setError('Failed to delete study group');
      }
    }
  };

  const isUserInGroup = (group) => {
    return myGroups.some(myGroup => myGroup.id === group.id);
  };

  const isGroupCreator = (group) => {
    return user && group.created_by === user.id;
  };

  const StudyGroupCard = ({ group, showJoinButton = true }) => (
    <Card className="mb-3 h-100">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{group.name}</h5>
        <Badge bg="primary">{group.subject}</Badge>
      </Card.Header>
      <Card.Body>
        <p className="text-muted mb-2">{group.description}</p>
        
        <div className="mb-2">
          <small className="text-muted">
            <FaCalendar className="me-1" />
            {group.schedule || 'Schedule TBD'}
          </small>
        </div>
        
        <div className="mb-2">
          <small className="text-muted">
            <FaMapMarkerAlt className="me-1" />
            {group.location || 'Location TBD'}
          </small>
        </div>
        
        <div className="mb-3">
          <small className="text-muted">
            <FaUsers className="me-1" />
            {group.member_count || 0} / {group.max_members} members
          </small>
        </div>
        
        <div className="mb-2">
          <small className="text-muted">
            <FaUser className="me-1" />
            Created by: {group.creator_name}
          </small>
        </div>
        
        {showJoinButton && user && (
          <div className="mt-3">
            {isUserInGroup(group) ? (
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  onClick={() => handleLeaveGroup(group.id)}
                >
                  Leave Group
                </Button>
                {isGroupCreator(group) && (
                  <Button 
                    variant="outline-dark" 
                    size="sm" 
                    onClick={() => handleDeleteGroup(group.id)}
                  >
                    <FaTrash className="me-1" />
                    Delete
                  </Button>
                )}
              </div>
            ) : (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => handleJoinGroup(group.id)}
                disabled={group.member_count >= group.max_members}
              >
                {group.member_count >= group.max_members ? 'Group Full' : 'Join Group'}
              </Button>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col lg={12}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Study Groups</h1>
            {user && (
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <FaPlus className="me-2" />
                Create Group
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {isWakingUp && process.env.NODE_ENV === 'production' && (
            <Alert variant="info" className="text-center">
              <Spinner animation="border" size="sm" className="me-2" />
              Connecting to server... This may take a moment if the server was sleeping.
            </Alert>
          )}

          {connectionError && (
            <Alert variant="warning" className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Connection Error:</strong> Unable to connect to the server. 
                {process.env.NODE_ENV === 'development' && (
                  <span> Make sure the backend server is running on port 5000.</span>
                )}
                {process.env.NODE_ENV === 'production' && (
                  <span> The server may be starting up - please try again in a moment.</span>
                )}
              </div>
              <Button 
                variant="outline-warning" 
                size="sm" 
                onClick={() => {
                  setConnectionError(false);
                  setRetryCount(0);
                  setLastRequestTime(0);
                  setLoading(true);
                  setIsWakingUp(true);
                  fetchStudyGroups();
                  if (user) fetchMyGroups();
                }}
              >
                Retry
              </Button>
            </Alert>
          )}

          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {!user && (
            <Alert variant="info">
              Please{' '}
              <Button 
                variant="link" 
                className="p-0 align-baseline text-decoration-underline"
                onClick={() => navigate('/login')}
              >
                log in
              </Button>{' '}
              to create or join study groups.
            </Alert>
          )}

          <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
            <Nav variant="tabs" className="mb-4">
              <Nav.Item>
                <Nav.Link eventKey="browse">Browse All Groups</Nav.Link>
              </Nav.Item>
              {user && (
                <Nav.Item>
                  <Nav.Link eventKey="my-groups">My Groups ({myGroups.length})</Nav.Link>
                </Nav.Item>
              )}
            </Nav>

            <Tab.Content>
              <Tab.Pane eventKey="browse">
                <Row>
                  {studyGroups.length === 0 ? (
                    <Col>
                      <div className="text-center py-5">
                        <FaUsers size={48} className="text-muted mb-3" />
                        <h4 className="text-muted">No study groups yet</h4>
                        <p className="text-muted">Be the first to create a study group!</p>
                      </div>
                    </Col>
                  ) : (
                    studyGroups.map(group => (
                      <Col md={6} lg={4} key={group.id}>
                        <StudyGroupCard group={group} />
                      </Col>
                    ))
                  )}
                </Row>
              </Tab.Pane>

              {user && (
                <Tab.Pane eventKey="my-groups">
                  <Row>
                    {myGroups.length === 0 ? (
                      <Col>
                        <div className="text-center py-5">
                          <FaUsers size={48} className="text-muted mb-3" />
                          <h4 className="text-muted">You haven't joined any groups yet</h4>
                          <p className="text-muted">Browse available groups to get started!</p>
                        </div>
                      </Col>
                    ) : (
                      myGroups.map(group => (
                        <Col md={6} lg={4} key={group.id}>
                          <StudyGroupCard group={group} showJoinButton={false} />
                        </Col>
                      ))
                    )}
                  </Row>
                </Tab.Pane>
              )}
            </Tab.Content>
          </Tab.Container>
        </Col>
      </Row>

      {/* Create Group Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Study Group</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateGroup}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Group Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="e.g., Calculus Study Group"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                    placeholder="e.g., Mathematics, Computer Science"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe what you'll study and any requirements..."
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Schedule</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.schedule}
                    onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                    placeholder="e.g., Tuesdays and Thursdays 7-9 PM"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Library Room 202, Online"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Maximum Members</Form.Label>
              <Form.Control
                type="number"
                min="2"
                max="20"
                value={formData.max_members}
                onChange={(e) => setFormData({...formData, max_members: parseInt(e.target.value)})}
              />
              <Form.Text className="text-muted">
                Recommended: 4-8 members for effective study sessions
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Study Group
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default StudyGroupsPage;
