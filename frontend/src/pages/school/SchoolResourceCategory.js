import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card, Table, Button, Space, Input, Select, Tag, Upload, Modal, Form, Row, Col, message, Badge, Tooltip
} from 'antd';
import {
  SearchOutlined, DownloadOutlined, EyeOutlined,
  FilePdfOutlined, FileImageOutlined, FileWordOutlined, FilePptOutlined,
  FileZipOutlined, FileUnknownOutlined, FileExcelOutlined, VideoCameraOutlined,
  AudioOutlined, AppstoreOutlined, UnorderedListOutlined, FileTextOutlined,
  LoadingOutlined, UploadOutlined, ClockCircleOutlined,
  EditOutlined, SaveOutlined, UndoOutlined, ExpandOutlined,
  MinusOutlined, PlusOutlined, EyeInvisibleOutlined,
  MailOutlined, PhoneOutlined, UserOutlined
} from '@ant-design/icons';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const { Option } = Select;
const { TextArea } = Input;

// TextOverlay Component for school name and contact info
const TextOverlay = ({ 
  schoolInfo, 
  textPosition, 
  isEditingText, 
  isDraggingText,
  setIsDraggingText,
  handleTextDrag,
  showControls,
  handleTextResize,
  handleTextOpacityChange,
  containerRef,
  activeElement
}) => {
  if (!schoolInfo.school_name && !schoolInfo.email && !schoolInfo.contact_number) {
    return null;
  }

  const renderTextElement = (type, text, x, y, size, opacity) => {
    const style = {
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-50%, -50%)',
      fontSize: `${size}px`,
      color: `rgba(0, 0, 0, ${opacity})`,
      fontWeight: type === 'name' ? 'bold' : 'normal',
      pointerEvents: isEditingText ? 'auto' : 'none',
      zIndex: 3,
      cursor: isEditingText ? (isDraggingText && activeElement === type ? 'grabbing' : 'grab') : 'default',
      textAlign: 'center',
      backgroundColor: isEditingText ? 'rgba(255, 255, 255, 0.7)' : 'transparent',
      padding: isEditingText ? '4px 8px' : '0',
      borderRadius: isEditingText ? '4px' : '0',
      border: isEditingText ? '2px dashed #1890ff' : 'none',
      whiteSpace: 'nowrap'
    };

    if (type === 'name') {
      return (
        <div
          style={style}
          onMouseDown={() => isEditingText && setIsDraggingText(type)}
          onMouseUp={() => setIsDraggingText(null)}
          onMouseLeave={() => setIsDraggingText(null)}
          onMouseMove={(e) => containerRef?.current && handleTextDrag(e, containerRef.current, type)}
        >
          {text}
        </div>
      );
    } else if (type === 'contact') {
      return (
        <div
          style={style}
          onMouseDown={() => isEditingText && setIsDraggingText(type)}
          onMouseUp={() => setIsDraggingText(null)}
          onMouseLeave={() => setIsDraggingText(null)}
          onMouseMove={(e) => containerRef?.current && handleTextDrag(e, containerRef.current, type)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            {schoolInfo.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MailOutlined style={{ fontSize: `${size - 4}px` }} />
                <span>{schoolInfo.email}</span>
              </div>
            )}
            {schoolInfo.contact_number && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PhoneOutlined style={{ fontSize: `${size - 4}px` }} />
                <span>{schoolInfo.contact_number}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <>
      {schoolInfo.school_name && renderTextElement(
        'name',
        schoolInfo.school_name,
        textPosition.name_x,
        textPosition.name_y,
        textPosition.name_size,
        textPosition.name_opacity
      )}
      
      {(schoolInfo.email || schoolInfo.contact_number) && renderTextElement(
        'contact',
        '',
        textPosition.contact_x,
        textPosition.contact_y,
        textPosition.contact_size,
        textPosition.contact_opacity
      )}
      
      {isEditingText && showControls && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(255,255,255,0.9)',
          padding: '10px',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 4,
          width: '220px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
            Text Watermark Controls
          </div>
          <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>
            Drag text to reposition, use buttons to adjust size/opacity
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', marginBottom: '4px' }}>School Name:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px' }}>Size:</span>
              <Button 
                size="small" 
                icon={<MinusOutlined />}
                onClick={() => handleTextResize('name', -2)}
                disabled={textPosition.name_size <= 8}
              />
              <span style={{ fontSize: '10px', minWidth: '20px', textAlign: 'center' }}>
                {textPosition.name_size}
              </span>
              <Button 
                size="small" 
                icon={<PlusOutlined />}
                onClick={() => handleTextResize('name', 2)}
                disabled={textPosition.name_size >= 40}
              />
              <Button 
                size="small" 
                icon={<EyeInvisibleOutlined />}
                onClick={() => handleTextOpacityChange('name', -0.1)}
                disabled={textPosition.name_opacity <= 0.1}
              />
              <span style={{ fontSize: '10px', minWidth: '20px', textAlign: 'center' }}>
                {(textPosition.name_opacity * 100).toFixed(0)}%
              </span>
              <Button 
                size="small" 
                icon={<EyeOutlined />}
                onClick={() => handleTextOpacityChange('name', 0.1)}
                disabled={textPosition.name_opacity >= 1.0}
              />
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '11px', marginBottom: '4px' }}>Contact Info:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '10px' }}>Size:</span>
              <Button 
                size="small" 
                icon={<MinusOutlined />}
                onClick={() => handleTextResize('contact', -1)}
                disabled={textPosition.contact_size <= 8}
              />
              <span style={{ fontSize: '10px', minWidth: '20px', textAlign: 'center' }}>
                {textPosition.contact_size}
              </span>
              <Button 
                size="small" 
                icon={<PlusOutlined />}
                onClick={() => handleTextResize('contact', 1)}
                disabled={textPosition.contact_size >= 20}
              />
              <Button 
                size="small" 
                icon={<EyeInvisibleOutlined />}
                onClick={() => handleTextOpacityChange('contact', -0.1)}
                disabled={textPosition.contact_opacity <= 0.1}
              />
              <span style={{ fontSize: '10px', minWidth: '20px', textAlign: 'center' }}>
                {(textPosition.contact_opacity * 100).toFixed(0)}%
              </span>
              <Button 
                size="small" 
                icon={<EyeOutlined />}
                onClick={() => handleTextOpacityChange('contact', 0.1)}
                disabled={textPosition.contact_opacity >= 1.0}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// LogoOverlay Component - UPDATED with containerRef prop
const LogoOverlay = ({ 
  logoUrl, 
  logoPosition, 
  isEditingLogo, 
  isDraggingLogo, 
  setIsDraggingLogo,
  handleLogoDrag,
  showControls,
  handleLogoResize,
  handleLogoOpacityChange,
  containerRef
}) => {
  const logoStyle = {
    position: 'absolute',
    left: `${logoPosition.x}%`,
    top: `${logoPosition.y}%`,
    width: `${logoPosition.width}%`,
    opacity: logoPosition.opacity,
    transform: 'translate(-50%, -50%)',
    pointerEvents: isEditingLogo ? 'auto' : 'none',
    zIndex: 2,
    transition: isDraggingLogo ? 'none' : 'all 0.2s ease',
    cursor: isEditingLogo ? (isDraggingLogo ? 'grabbing' : 'grab') : 'default',
    filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
    maxWidth: '150px',
    maxHeight: '80px',
    objectFit: 'contain'
  };

  return (
    <>
      <img
        src={logoUrl}
        alt="School Logo"
        style={logoStyle}
        draggable={false}
        onMouseDown={() => isEditingLogo && setIsDraggingLogo(true)}
        onMouseUp={() => setIsDraggingLogo(false)}
        onMouseLeave={() => setIsDraggingLogo(false)}
        onMouseMove={(e) => containerRef?.current && handleLogoDrag(e, containerRef.current)}
      />
      
      {isEditingLogo && showControls && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(255,255,255,0.9)',
          padding: '10px',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 3
        }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
            Logo Controls
          </div>
          <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>
            Drag to reposition, use buttons to adjust
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '8px' 
          }}>
            <span style={{ fontSize: '11px' }}>Size:</span>
            <Button 
              size="small" 
              icon={<MinusOutlined />} 
              onClick={() => handleLogoResize(-5)}
              disabled={logoPosition.width <= 5}
            />
            <span style={{ fontSize: '11px', minWidth: '30px', textAlign: 'center' }}>
              {logoPosition.width}%
            </span>
            <Button 
              size="small" 
              icon={<PlusOutlined />} 
              onClick={() => handleLogoResize(5)}
              disabled={logoPosition.width >= 50}
            />
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <span style={{ fontSize: '11px' }}>Opacity:</span>
            <Button 
              size="small" 
              icon={<EyeInvisibleOutlined />} 
              onClick={() => handleLogoOpacityChange(-0.1)}
              disabled={logoPosition.opacity <= 0.1}
            />
            <span style={{ fontSize: '11px', minWidth: '30px', textAlign: 'center' }}>
              {(logoPosition.opacity * 100).toFixed(0)}%
            </span>
            <Button 
              size="small" 
              icon={<EyeOutlined />} 
              onClick={() => handleLogoOpacityChange(0.1)}
              disabled={logoPosition.opacity >= 1.0}
            />
          </div>
        </div>
      )}
    </>
  );
};

const SchoolResourceCategory = ({ user }) => {
  const { category } = useParams();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [previewResource, setPreviewResource] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  
  // Logo positioning states
  const [logoPosition, setLogoPosition] = useState({ x: 50, y: 10, width: 20, opacity: 0.7 });
  const [isEditingLogo, setIsEditingLogo] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [showLogoControls, setShowLogoControls] = useState(true);
  const [positionLoading, setPositionLoading] = useState(false);
  const [isDefaultPosition, setIsDefaultPosition] = useState(true);
  
  // Text watermark states
  const [textPosition, setTextPosition] = useState({
    name_x: 50, name_y: 25, name_size: 20, name_opacity: 0.8,
    contact_x: 50, contact_y: 90, contact_size: 12, contact_opacity: 0.7
  });
  const [isEditingText, setIsEditingText] = useState(false);
  const [isDraggingText, setIsDraggingText] = useState(null);
  const [isDefaultText, setIsDefaultText] = useState(true);
  const [schoolInfo, setSchoolInfo] = useState({});
  
  const iframeRef = useRef(null);
  const videoRefs = useRef({});
  const pdfContainerRef = useRef(null);
  const imageContainerRef = useRef(null);
  const docContainerRef = useRef(null);
  
  // Add mouse up event listener for dragging
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDraggingLogo(false);
      setIsDraggingText(null);
    };
    
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  
  // Get category titles and descriptions
  const getCategoryInfo = () => {
    const categories = {
      'academic': {
        title: 'Academic Resources',
        description: 'Manage curriculum, lesson plans, worksheets, and other teaching materials'
      },
      'marketing': {
        title: 'Marketing Materials',
        description: 'Manage brochures, banners, and promotional content'
      },
      'administrative': {
        title: 'Administrative Resources',
        description: 'Manage forms, templates, and policy documents'
      },
      'training': {
        title: 'Training Resources',
        description: 'Manage teacher training materials and guides'
      },
      'event': {
        title: 'Event & Celebration',
        description: 'Manage event plans and celebration materials'
      },
      'multimedia': {
        title: 'Multimedia Collection',
        description: 'Manage videos, audio, and interactive content'
      }
    };
    return categories[category] || { title: category, description: '' };
  };

  const categoryInfo = getCategoryInfo();

  useEffect(() => {
    console.log(`Category changed to: ${category}`);
    fetchResources();
    fetchSchoolInfo();
  }, [category, user.school_id]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      console.log(`Fetching resources for category: ${category}, school_id: ${user.school_id}`);
      const response = await axios.get(`${API}/school/resources`, {
        params: {
          category: category,
          school_id: user.school_id
        }
      });
      console.log(`API Response for ${category}:`, response.data.length, 'resources');
      
      // Format resources with proper URLs and mark school's own uploads
      const formattedResources = response.data.map((resource, index) => {
        let file_path = resource.file_path;
        
        // Fix file path - ensure it's a complete URL
        if (file_path) {
          if (file_path.startsWith('http')) {
            // Already a full URL
          } else if (file_path.startsWith('/')) {
            // Path starting with /, prepend backend URL
            file_path = `${BACKEND_URL}${file_path}`;
          } else {
            // Relative path, construct full URL
            if (file_path.includes('uploads/')) {
              file_path = `${BACKEND_URL}/${file_path}`;
            } else {
              file_path = `${BACKEND_URL}/uploads/${file_path.replace(/^\/uploads\//, '')}`;
            }
          }
        }
        
        // Check if this is school's own upload
        const isOwnUpload = resource.uploaded_by_id === user.school_id;
        
        return {
          ...resource,
          key: resource.resource_id || resource.id || `resource-${index}`,
          file_path: file_path,
          is_own_upload: isOwnUpload,
          display_status: isOwnUpload ? resource.approval_status : 'approved'
        };
      });
      
      console.log(`Formatted ${formattedResources.length} resources for category: ${category}`);
      // Log the categories of fetched resources to verify filtering
      formattedResources.forEach(res => {
        console.log(`Resource: ${res.name}, Category: ${res.category}, IsOwn: ${res.is_own_upload}`);
      });
      
      setResources(formattedResources);
    } catch (error) {
      console.error('Error fetching resources:', error);
      message.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  // Fetch school info including contact number
  const fetchSchoolInfo = async () => {
    try {
      // Use existing user data and fetch additional info
      const response = await axios.get(`${API}/admin/schools`);
      const schoolData = response.data.find(s => s.school_id === user.school_id);
      if (schoolData) {
        setSchoolInfo({
          school_name: schoolData.school_name,
          email: schoolData.email,
          contact_number: schoolData.contact_number
        });
        console.log('School info fetched:', {
          school_name: schoolData.school_name,
          email: schoolData.email,
          contact_number: schoolData.contact_number
        });
      }
    } catch (error) {
      console.error('Error fetching school info:', error);
      // Fallback to user data
      setSchoolInfo({
        school_name: user.name,
        email: user.email,
        contact_number: null
      });
    }
  };

  // Fetch logo position for a resource
  const fetchLogoPosition = async (resourceId) => {
    if (!resourceId || category === 'multimedia') return;
    
    try {
      setPositionLoading(true);
      const response = await axios.get(`${API}/school/logo-position/${resourceId}`, {
        params: { school_id: user.school_id }
      });
      
      console.log('Fetched logo position:', response.data);
      
      setLogoPosition({
        x: response.data.x_position,
        y: response.data.y_position,
        width: response.data.width,
        opacity: response.data.opacity
      });
      setIsDefaultPosition(response.data.is_default);
      
      // Fetch school logo URL
      if (user.logo_path) {
        const fullLogoUrl = user.logo_path.startsWith('http') 
          ? user.logo_path 
          : `${BACKEND_URL}${user.logo_path}`;
        setLogoUrl(fullLogoUrl);
        console.log('School logo URL:', fullLogoUrl);
      } else {
        console.log('No logo path for user');
      }
    } catch (error) {
      console.error('Error fetching logo position:', error);
      // Use defaults if error occurs
      setLogoPosition({ x: 50, y: 10, width: 20, opacity: 0.7 });
      setIsDefaultPosition(true);
    } finally {
      setPositionLoading(false);
    }
  };

  // Fetch text position for a resource
  const fetchTextPosition = async (resourceId) => {
    if (!resourceId || category === 'multimedia') return;
    
    try {
      const response = await axios.get(`${API}/school/text-watermark/${resourceId}`, {
        params: { school_id: user.school_id }
      });
      
      console.log('Fetched text position:', response.data);
      
      setTextPosition({
        name_x: response.data.name_x,
        name_y: response.data.name_y,
        name_size: response.data.name_size,
        name_opacity: response.data.name_opacity,
        contact_x: response.data.contact_x,
        contact_y: response.data.contact_y,
        contact_size: response.data.contact_size,
        contact_opacity: response.data.contact_opacity
      });
      setIsDefaultText(response.data.is_default);
    } catch (error) {
      console.error('Error fetching text position:', error);
      // Use defaults if error occurs
      setTextPosition({
        name_x: 50, name_y: 25, name_size: 20, name_opacity: 0.8,
        contact_x: 50, contact_y: 90, contact_size: 12, contact_opacity: 0.7
      });
      setIsDefaultText(true);
    }
  };

  // Save logo position
  const saveLogoPosition = async () => {
    if (!previewResource || category === 'multimedia') return;
    
    try {
      // Round float values to integers as backend expects integers
      const roundedPosition = {
        x: Math.round(logoPosition.x),
        y: Math.round(logoPosition.y),
        width: Math.round(logoPosition.width),
        opacity: Number(logoPosition.opacity.toFixed(2))
      };
      
      console.log('Saving logo position with data:', {
        school_id: user.school_id,
        resource_id: previewResource.resource_id,
        logoPosition: roundedPosition
      });
      
      // Create FormData object
      const formData = new FormData();
      formData.append('school_id', user.school_id);
      formData.append('resource_id', previewResource.resource_id);
      formData.append('x_position', roundedPosition.x.toString());
      formData.append('y_position', roundedPosition.y.toString());
      formData.append('width', roundedPosition.width.toString());
      formData.append('opacity', roundedPosition.opacity.toString());
      
      const response = await axios.post(`${API}/school/logo-position`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Save logo position response:', response.data);
      
      setIsEditingLogo(false);
      setIsDefaultPosition(false);
      message.success('Logo position saved successfully!');
    } catch (error) {
      console.error('Error saving logo position:', error);
      console.error('Error response:', error.response?.data);
      message.error('Failed to save logo position');
    }
  };

  // Save text position
  const saveTextPosition = async () => {
    if (!previewResource || category === 'multimedia') return;
    
    try {
      const formData = new FormData();
      formData.append('school_id', user.school_id);
      formData.append('resource_id', previewResource.resource_id);
      formData.append('name_x', Math.round(textPosition.name_x).toString());
      formData.append('name_y', Math.round(textPosition.name_y).toString());
      formData.append('name_size', textPosition.name_size.toString());
      formData.append('name_opacity', textPosition.name_opacity.toFixed(2));
      formData.append('contact_x', Math.round(textPosition.contact_x).toString());
      formData.append('contact_y', Math.round(textPosition.contact_y).toString());
      formData.append('contact_size', textPosition.contact_size.toString());
      formData.append('contact_opacity', textPosition.contact_opacity.toFixed(2));
      
      const response = await axios.post(`${API}/school/text-watermark`, formData);
      
      console.log('Save text position response:', response.data);
      
      setIsEditingText(false);
      setIsDefaultText(false);
      message.success('Text watermark position saved successfully!');
    } catch (error) {
      console.error('Error saving text position:', error);
      console.error('Error response:', error.response?.data);
      message.error('Failed to save text position');
    }
  };

  // Reset logo position to default
  const resetLogoPosition = async () => {
    if (!previewResource || category === 'multimedia') return;
    
    try {
      console.log('Resetting logo position for resource:', previewResource.resource_id);
      
      await axios.delete(`${API}/school/logo-position/${previewResource.resource_id}`, {
        params: { school_id: user.school_id }
      });
      
      setLogoPosition({ x: 50, y: 10, width: 20, opacity: 0.7 });
      setIsDefaultPosition(true);
      setIsEditingLogo(false);
      message.success('Logo position reset to default');
    } catch (error) {
      console.error('Error resetting logo position:', error);
      message.error('Failed to reset logo position');
    }
  };

  // Reset text position to default
  const resetTextPosition = async () => {
    if (!previewResource || category === 'multimedia') return;
    
    try {
      console.log('Resetting text position for resource:', previewResource.resource_id);
      
      // Note: You might want to create a DELETE endpoint for text watermark
      // For now, we'll just reset locally and mark as default
      setTextPosition({
        name_x: 50, name_y: 25, name_size: 20, name_opacity: 0.8,
        contact_x: 50, contact_y: 90, contact_size: 12, contact_opacity: 0.7
      });
      setIsDefaultText(true);
      setIsEditingText(false);
      message.success('Text watermark position reset to default');
    } catch (error) {
      console.error('Error resetting text position:', error);
      message.error('Failed to reset text position');
    }
  };

  // Logo drag handler
  const handleLogoDrag = (e, container) => {
    if (!isDraggingLogo || !container) return;
    
    const rect = container.getBoundingClientRect();
    
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Keep within bounds
    const boundedX = Math.max(0, Math.min(100, x));
    const boundedY = Math.max(0, Math.min(100, y));
    
    setLogoPosition(prev => ({ ...prev, x: boundedX, y: boundedY }));
  };

  // Text drag handler
  const handleTextDrag = (e, container, elementType) => {
    if (!isDraggingText || !container) return;
    
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const boundedX = Math.max(0, Math.min(100, x));
    const boundedY = Math.max(0, Math.min(100, y));
    
    if (elementType === 'name') {
      setTextPosition(prev => ({ ...prev, name_x: boundedX, name_y: boundedY }));
    } else if (elementType === 'contact') {
      setTextPosition(prev => ({ ...prev, contact_x: boundedX, contact_y: boundedY }));
    }
  };

  // Logo resize handler
  const handleLogoResize = (change) => {
    setLogoPosition(prev => ({
      ...prev,
      width: Math.max(5, Math.min(50, prev.width + change))
    }));
  };

  // Text resize handler
  const handleTextResize = (elementType, change) => {
    if (elementType === 'name') {
      setTextPosition(prev => ({
        ...prev,
        name_size: Math.max(8, Math.min(40, prev.name_size + change))
      }));
    } else if (elementType === 'contact') {
      setTextPosition(prev => ({
        ...prev,
        contact_size: Math.max(8, Math.min(20, prev.contact_size + change))
      }));
    }
  };

  // Logo opacity handler
  const handleLogoOpacityChange = (change) => {
    setLogoPosition(prev => ({
      ...prev,
      opacity: Math.max(0.1, Math.min(1.0, prev.opacity + change))
    }));
  };

  // Text opacity handler
  const handleTextOpacityChange = (elementType, change) => {
    if (elementType === 'name') {
      setTextPosition(prev => ({
        ...prev,
        name_opacity: Math.max(0.1, Math.min(1.0, prev.name_opacity + change))
      }));
    } else if (elementType === 'contact') {
      setTextPosition(prev => ({
        ...prev,
        contact_opacity: Math.max(0.1, Math.min(1.0, prev.contact_opacity + change))
      }));
    }
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('Please select a file to upload');
      return;
    }

    try {
      const values = await form.validateFields();

      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj);
      formData.append('name', values.name);
      formData.append('category', category);
      formData.append('school_id', user.school_id);
      formData.append('school_name', user.name);
      formData.append('description', values.description || '');
      formData.append('class_level', values.class_level || '');
      formData.append('tags', values.tags ? values.tags.join(',') : '');

      setUploading(true);
      const response = await axios.post(`${API}/school/resources/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      message.success('Resource uploaded successfully! Waiting for admin approval.');
      form.resetFields();
      setFileList([]);
      setIsModalVisible(false);
      fetchResources(); // Refresh the list
    } catch (error) {
      console.error('Error uploading resource:', error);
      message.error(error.response?.data?.detail || 'Failed to upload resource');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (record) => {
    try {
      const token = localStorage.getItem('token');
      
      // Create the download URL with school info
      const downloadUrl = `${API}/resources/${record.resource_id}/download-with-logo`;
      const urlWithParams = new URL(downloadUrl);
      urlWithParams.searchParams.append('school_id', user.school_id);
      urlWithParams.searchParams.append('school_name', user.name);
      
      console.log('Download URL with logo:', urlWithParams.toString());
      
      // Create a temporary link element for downloading
      const downloadLink = document.createElement('a');
      
      try {
        // Try to download using fetch API first
        const response = await fetch(urlWithParams.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/octet-stream',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get the blob and create a local URL
        const blob = await response.blob();
        
        if (blob.size === 0) {
          throw new Error('Received empty file');
        }
        
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Set up the download link
        downloadLink.href = blobUrl;
        
        // Get filename from response headers or use record name
        const contentDisposition = response.headers.get('content-disposition');
        let filename = record.name || 'download';
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }
        
        // Add file extension if missing
        if (!filename.includes('.')) {
          const fileExtension = record.file_type?.split('/').pop() || 
                               record.file_path?.split('.').pop() || 
                               '';
          if (fileExtension) {
            filename = `${filename}.${fileExtension}`;
          }
        }
        
        downloadLink.download = filename;
        downloadLink.rel = 'noopener noreferrer';
        
        // Trigger the download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(downloadLink);
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
        
        // Update download count in UI immediately
        setResources(prevResources =>
          prevResources.map(res =>
            res.resource_id === record.resource_id
              ? { ...res, download_count: (res.download_count || 0) + 1 }
              : res
          )
        );
        
        message.success('Download started with school branding!');
      } catch (fetchError) {
        console.error('Error downloading via fetch:', fetchError);
        
        // Fallback: open in new tab
        window.open(urlWithParams.toString(), '_blank', 'noopener,noreferrer');
        
        // Still try to update the UI count
        setResources(prevResources =>
          prevResources.map(res =>
            res.resource_id === record.resource_id
              ? { ...res, download_count: (res.download_count || 0) + 1 }
              : res
          )
        );
        
        message.info('Opening branded download in new tab...');
      }
    } catch (error) {
      console.error('Error in handleDownload:', error);
      message.error(`Failed to download file: ${error.message}`);
    }
  };

  const handlePreview = async (record) => {
    setPreviewResource(record);
    setPreviewLoading(true);
    setIsPreviewModalVisible(true);

    // Reset any existing video playback
    if (videoRefs.current[record.resource_id]) {
      videoRefs.current[record.resource_id].pause();
      videoRefs.current[record.resource_id].currentTime = 0;
    }

    // Fetch logo and text positions for this resource (except multimedia category)
    if (category !== 'multimedia') {
      await fetchLogoPosition(record.resource_id);
      await fetchTextPosition(record.resource_id);
    }

    // Stop loading after 3 seconds if content doesn't load
    setTimeout(() => {
      setPreviewLoading(false);
    }, 3000);
  };

  const renderPreview = () => {
    if (!previewResource) return null;

    if (previewLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <LoadingOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          <p>Loading preview...</p>
        </div>
      );
    }

    const fileType = previewResource.file_type ? previewResource.file_type.toLowerCase() : '';
    const fileName = previewResource.file_path ? previewResource.file_path.split('/').pop() : '';
    const fileExtension = fileName ? fileName.split('.').pop().toLowerCase() : '';

    // Generate proper preview URL
    const getPreviewUrl = () => {
      const previewUrl = `${API}/resources/${previewResource.resource_id}/preview`;
      console.log('Using preview URL:', previewUrl);
      return previewUrl;
    };

    const previewUrl = getPreviewUrl();

    // Check for PDF
    if (fileType.includes('pdf') || fileExtension === 'pdf') {
      // Stop loading immediately for PDFs as they stream progressively
      if (previewLoading) {
        setTimeout(() => setPreviewLoading(false), 500);
      }
      
      return (
        <div 
          ref={pdfContainerRef}
          style={{ 
            width: '100%', 
            height: '100%', 
            position: 'relative', 
            overflow: 'hidden',
            backgroundColor: '#f5f5f5'
          }}
        >
          <iframe
            ref={iframeRef}
            src={previewUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1
            }}
            title={previewResource.name}
            onLoad={() => {
              console.log('PDF iframe loaded successfully');
              setPreviewLoading(false);
            }}
            onError={(e) => {
              console.error('PDF iframe error:', e);
              setPreviewLoading(false);
              message.error('Failed to load PDF preview. Try downloading instead.');
            }}
          />
          {category !== 'multimedia' && logoUrl && (
            <LogoOverlay
              logoUrl={logoUrl}
              logoPosition={logoPosition}
              isEditingLogo={isEditingLogo}
              isDraggingLogo={isDraggingLogo}
              setIsDraggingLogo={setIsDraggingLogo}
              handleLogoDrag={handleLogoDrag}
              showControls={showLogoControls}
              handleLogoResize={handleLogoResize}
              handleLogoOpacityChange={handleLogoOpacityChange}
              containerRef={pdfContainerRef}
            />
          )}
          {category !== 'multimedia' && (schoolInfo.school_name || schoolInfo.email || schoolInfo.contact_number) && (
            <TextOverlay
              schoolInfo={schoolInfo}
              textPosition={textPosition}
              isEditingText={isEditingText}
              isDraggingText={isDraggingText}
              setIsDraggingText={setIsDraggingText}
              handleTextDrag={handleTextDrag}
              showControls={showLogoControls}
              handleTextResize={handleTextResize}
              handleTextOpacityChange={handleTextOpacityChange}
              containerRef={pdfContainerRef}
              activeElement={isDraggingText}
            />
          )}
        </div>
      );
    }

    // Check for images
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    if (imageExtensions.includes(fileExtension) || fileType.includes('image')) {
      // Images typically load fast, stop loading spinner immediately
      if (previewLoading) {
        setTimeout(() => setPreviewLoading(false), 300);
      }
      
      return (
        <div 
          ref={imageContainerRef}
          style={{ 
            textAlign: 'center', 
            maxHeight: '100%', 
            overflow: 'auto',
            position: 'relative',
            height: '100%',
            width: '100%',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src={previewUrl}
            alt={previewResource.name}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '8px',
              position: 'relative',
              zIndex: 1
            }}
            onLoad={() => {
              console.log('Image loaded successfully');
              setPreviewLoading(false);
            }}
            onError={(e) => {
              console.error('Image load error:', e);
              setPreviewLoading(false);
              // Fallback to direct file path
              if (previewResource.file_path && previewResource.file_path.startsWith('http')) {
                e.target.src = previewResource.file_path;
                message.info('Trying alternative source...');
              } else {
                message.error('Failed to load image preview');
              }
            }}
          />
          {category !== 'multimedia' && logoUrl && (
            <LogoOverlay
              logoUrl={logoUrl}
              logoPosition={logoPosition}
              isEditingLogo={isEditingLogo}
              isDraggingLogo={isDraggingLogo}
              setIsDraggingLogo={setIsDraggingLogo}
              handleLogoDrag={handleLogoDrag}
              showControls={showLogoControls}
              handleLogoResize={handleLogoResize}
              handleLogoOpacityChange={handleLogoOpacityChange}
              containerRef={imageContainerRef}
            />
          )}
          {category !== 'multimedia' && (schoolInfo.school_name || schoolInfo.email || schoolInfo.contact_number) && (
            <TextOverlay
              schoolInfo={schoolInfo}
              textPosition={textPosition}
              isEditingText={isEditingText}
              isDraggingText={isDraggingText}
              setIsDraggingText={setIsDraggingText}
              handleTextDrag={handleTextDrag}
              showControls={showLogoControls}
              handleTextResize={handleTextResize}
              handleTextOpacityChange={handleTextOpacityChange}
              containerRef={imageContainerRef}
              activeElement={isDraggingText}
            />
          )}
        </div>
      );
    }

    // Check for videos
    if (fileType.includes('video') || ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(fileExtension)) {
      // Stop loading as soon as video metadata is loaded
      if (previewLoading) {
        setTimeout(() => setPreviewLoading(false), 500);
      }
      
      return (
        <div style={{ textAlign: 'center', maxHeight: '600px', overflow: 'auto' }}>
          <video
            ref={el => {
              if (el && previewResource) {
                videoRefs.current[previewResource.resource_id] = el;
              }
            }}
            controls
            autoPlay
            preload="metadata"
            style={{
              width: '100%',
              maxHeight: '600px',
              borderRadius: '8px'
            }}
            onLoadedMetadata={() => {
              console.log('Video metadata loaded');
              setPreviewLoading(false);
            }}
            onLoadedData={() => {
              console.log('Video loaded successfully');
              setPreviewLoading(false);
            }}
            onError={() => {
              setPreviewLoading(false);
              message.error('Failed to load video preview');
            }}
            onPlay={() => {
              // Pause all other videos when one starts playing
              Object.keys(videoRefs.current).forEach(key => {
                if (key !== previewResource?.resource_id && videoRefs.current[key]) {
                  videoRefs.current[key].pause();
                }
              });
            }}
          >
            <source src={previewUrl} type={previewResource.file_type || 'video/mp4'} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Check for audio
    const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'flac'];
    if (audioExtensions.includes(fileExtension) || fileType.includes('audio')) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <AudioOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: '16px' }} />
          <audio
            controls
            style={{ width: '100%', marginTop: '20px' }}
            onLoadedData={() => setPreviewLoading(false)}
            onError={() => {
              setPreviewLoading(false);
              message.error('Failed to load audio preview');
            }}
          >
            <source src={previewUrl} type={previewResource.file_type || 'audio/mp3'} />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }

    // For documents (Word, Excel, PowerPoint)
    const docExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    if (docExtensions.includes(fileExtension)) {
      return (
        <div 
          ref={docContainerRef}
          style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
        >
          <iframe
            src={previewUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1
            }}
            title={`Preview - ${previewResource.name}`}
            onLoad={() => setPreviewLoading(false)}
            onError={() => {
              setPreviewLoading(false);
              // Fallback to Google Docs viewer
              const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(previewUrl)}&embedded=true`;
              if (iframeRef.current) {
                iframeRef.current.src = googleDocsViewerUrl;
              }
            }}
          />
          {category !== 'multimedia' && logoUrl && (
            <LogoOverlay
              logoUrl={logoUrl}
              logoPosition={logoPosition}
              isEditingLogo={isEditingLogo}
              isDraggingLogo={isDraggingLogo}
              setIsDraggingLogo={setIsDraggingLogo}
              handleLogoDrag={handleLogoDrag}
              showControls={showLogoControls}
              handleLogoResize={handleLogoResize}
              handleLogoOpacityChange={handleLogoOpacityChange}
              containerRef={docContainerRef}
            />
          )}
          {category !== 'multimedia' && (schoolInfo.school_name || schoolInfo.email || schoolInfo.contact_number) && (
            <TextOverlay
              schoolInfo={schoolInfo}
              textPosition={textPosition}
              isEditingText={isEditingText}
              isDraggingText={isDraggingText}
              setIsDraggingText={setIsDraggingText}
              handleTextDrag={handleTextDrag}
              showControls={showLogoControls}
              handleTextResize={handleTextResize}
              handleTextOpacityChange={handleTextOpacityChange}
              containerRef={docContainerRef}
              activeElement={isDraggingText}
            />
          )}
        </div>
      );
    }

    // Default fallback for unsupported file types
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        {getFileIcon(previewResource.file_type, 64)}
        <h3 style={{ marginTop: '16px' }}>{previewResource.name}</h3>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          Preview not available for this file type. Please download to view.
        </p>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => handleDownload(previewResource)}
          size="large"
        >
          Download to View
        </Button>
      </div>
    );
  };

  const getFileIcon = (fileType, size = 32) => {
    if (!fileType) return <FileUnknownOutlined style={{ fontSize: `${size}px` }} />;

    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: `${size}px` }} />;
    if (type.includes('word') || type.includes('doc')) return <FileWordOutlined style={{ color: '#1890ff', fontSize: `${size}px` }} />;
    if (type.includes('powerpoint') || type.includes('ppt')) return <FilePptOutlined style={{ color: '#ffa940', fontSize: `${size}px` }} />;
    if (type.includes('excel') || type.includes('xls')) return <FileExcelOutlined style={{ color: '#52c41a', fontSize: `${size}px` }} />;
    if (type.includes('image')) return <FileImageOutlined style={{ color: '#722ed1', fontSize: `${size}px` }} />;
    if (type.includes('video')) return <VideoCameraOutlined style={{ color: '#13c2c2', fontSize: `${size}px` }} />;
    if (type.includes('audio')) return <AudioOutlined style={{ color: '#eb2f96', fontSize: `${size}px` }} />;
    if (type.includes('zip') || type.includes('rar')) return <FileZipOutlined style={{ color: '#fa8c16', fontSize: `${size}px` }} />;
    if (type.includes('text') || type.includes('txt')) return <FileTextOutlined style={{ color: '#8c8c8c', fontSize: `${size}px` }} />;
    return <FileUnknownOutlined style={{ fontSize: `${size}px` }} />;
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchText.toLowerCase()) ||
      resource.tags?.toLowerCase().includes(searchText.toLowerCase());
    const matchesClass = selectedClass === 'all' || resource.class_level === selectedClass;
    const matchesStatus = selectedStatus === 'all' || resource.display_status === selectedStatus;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const getStatusTag = (resource) => {
    const status = resource.display_status || resource.approval_status;
    
    if (resource.is_own_upload) {
      // For school's own uploads, show approval status
      const statusMap = {
        'pending': { color: 'orange', text: 'Pending Approval', icon: <ClockCircleOutlined /> },
        'approved': { color: 'green', text: 'Approved', icon: null },
        'rejected': { color: 'red', text: 'Rejected', icon: null }
      };
      const statusInfo = statusMap[status] || { color: 'default', text: 'Unknown', icon: null };
      
      return (
        <Tag color={statusInfo.color} icon={statusInfo.icon}>
          {statusInfo.text}
        </Tag>
      );
    } else {
      // For admin uploads, show as available
      return <Tag color="green">Available</Tag>;
    }
  };

  const renderThumbnail = (resource) => {
    const fileUrl = resource.file_path;
    const fileType = resource.file_type?.toLowerCase() || '';
    const fileExtension = fileUrl?.split('.').pop()?.toLowerCase() || '';

    // For PDFs
    if (fileType.includes('pdf') || fileExtension === 'pdf') {
      return (
        <div
          style={{
            height: '150px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <iframe
              src={`${fileUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0&zoom=50`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                pointerEvents: 'none'
              }}
              title={`PDF thumbnail - ${resource.name}`}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.1)'
            }}>
              <FilePdfOutlined style={{ fontSize: '32px', color: '#ff4d4f', opacity: 0.8 }} />
            </div>
          </div>
        </div>
      );
    }

    // For images
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    if (imageExtensions.includes(fileExtension) || fileType.includes('image')) {
      return (
        <div style={{ position: 'relative', height: '150px', overflow: 'hidden' }}>
          <img
            src={fileUrl}
            alt={resource.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `
                <div style="height: 150px; display: flex; align-items: center; justify-content: center; background: #f5f5f5">
                  <div style="font-size: 32px; color: #999;">
                    ${getFileIcon(resource.file_type, 32).props.children}
                  </div>
                </div>
              `;
            }}
          />
        </div>
      );
    }

    // Default thumbnail for other file types
    return (
      <div style={{
        height: '150px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        {getFileIcon(resource.file_type, 48)}
      </div>
    );
  };

  const columns = [
    {
      title: 'Resource',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {getFileIcon(record.file_type, 24)}
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title={text}>
                <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {text}
                </span>
              </Tooltip>
              {record.is_own_upload && (
                <Tag color="blue" style={{ marginLeft: 8, fontSize: '10px' }}>Your Upload</Tag>
              )}
            </div>
            {record.uploaded_by_name && record.uploaded_by_type !== 'admin' && (
              <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                Uploaded by: {record.uploaded_by_name}
              </div>
            )}
          </div>
        </Space>
      ),
      width: '30%',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatusTag(record),
      width: '15%',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => text || '-',
      width: '20%',
    },
    {
      title: 'Class',
      dataIndex: 'class_level',
      key: 'class_level',
      render: (level) => level ? <Tag color="blue">{level}</Tag> : <Tag>All</Tag>,
      width: '10%',
    },
    {
      title: 'Size',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size) => {
        if (!size) return '-';
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(2)} MB`;
      },
      width: '10%',
    },
    {
      title: 'Downloads',
      dataIndex: 'download_count',
      key: 'download_count',
      render: (count) => <Badge count={count || 0} showZero style={{ backgroundColor: '#52c41a' }} />,
      width: '10%',
    },
    {
      title: 'Uploaded',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
      width: '10%',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Preview">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          <Tooltip title="Download">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
              disabled={record.is_own_upload && record.display_status !== 'approved'}
            />
          </Tooltip>
        </Space>
      ),
      width: '10%',
    },
  ];

  const renderGridView = () => (
    <Row gutter={[16, 16]}>
      {filteredResources.map(resource => (
        <Col xs={24} sm={12} md={8} lg={6} key={resource.key}>
          <Card
            hoverable
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
            styles={{
              body: {
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '12px'
              }
            }}
            cover={
              <div
                style={{
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => handlePreview(resource)}
              >
                {renderThumbnail(resource)}
                <div style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {resource.file_type?.split('/').pop() || 'File'}
                </div>
                {resource.is_own_upload && (
                  <div style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    background: 'rgba(24, 144, 255, 0.8)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    YOURS
                  </div>
                )}
              </div>
            }
            actions={[
              <Tooltip title="Preview" key="preview">
                <EyeOutlined onClick={() => handlePreview(resource)} />
              </Tooltip>,
              <Tooltip title="Download" key="download">
                <DownloadOutlined 
                  onClick={() => handleDownload(resource)} 
                  style={resource.is_own_upload && resource.display_status !== 'approved' ? { 
                    color: '#d9d9d9', 
                    cursor: 'not-allowed' 
                  } : {}}
                />
              </Tooltip>
            ]}
          >
            <div style={{ flex: 1 }}>
              <Tooltip title={resource.name}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {resource.name}
                </div>
              </Tooltip>

              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', height: '36px', overflow: 'hidden' }}>
                {resource.description || 'No description provided'}
              </div>

              <div style={{ marginTop: 'auto' }}>
                <Space size={[4, 4]} wrap>
                  {resource.class_level && <Tag color="blue" style={{ margin: 0 }}>{resource.class_level}</Tag>}
                  <Tag style={{ margin: 0 }}>
                    {resource.file_size < 1024 * 1024
                      ? `${(resource.file_size / 1024).toFixed(1)} KB`
                      : `${(resource.file_size / (1024 * 1024)).toFixed(2)} MB`}
                  </Tag>
                  {getStatusTag(resource)}
                </Space>

                <div style={{
                  marginTop: '8px',
                  color: '#999',
                  fontSize: '11px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{resource.download_count || 0} downloads</span>
                  <span>
                    {resource.created_at ? new Date(resource.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );

  const handleFileChange = ({ fileList }) => {
    setFileList(fileList.slice(-1));
  };

  const beforeUpload = (file) => {
    const isLt100M = file.size / 1024 / 1024 < 100;
    if (!isLt100M) {
      message.error('File must be smaller than 100MB!');
      return Upload.LIST_IGNORE;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'video/mp4',
      'video/webm',
      'video/ogg',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|gif|webp|svg|mp4|webm|ogg|mp3|wav|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar)$/i)) {
      message.error('File type not supported!');
      return Upload.LIST_IGNORE;
    }

    return false;
  };

  return (
    <div>
      <Card
        title={
          <div>
            <h2 style={{ margin: 0 }}>{categoryInfo.title}</h2>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{categoryInfo.description}</p>
          </div>
        }
        extra={
          <Space wrap>
            <Button
              icon={viewMode === 'list' ? <AppstoreOutlined /> : <UnorderedListOutlined />}
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            >
              {viewMode === 'list' ? 'Grid View' : 'List View'}
            </Button>
            <Input
              placeholder="Search resources..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              value={selectedClass}
              onChange={setSelectedClass}
              style={{ width: 150, marginRight: 8 }}
              placeholder="Filter by class"
            >
              <Option value="all">All Classes</Option>
              <Option value="Nursery">Nursery</Option>
              <Option value="LKG">LKG</Option>
              <Option value="UKG">UKG</Option>
              <Option value="Grade 1">Grade 1</Option>
              <Option value="Grade 2">Grade 2</Option>
            </Select>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: 150 }}
              placeholder="Filter by status"
            >
              <Option value="all">All Status</Option>
              <Option value="approved">Approved</Option>
              <Option value="pending">Pending</Option>
            </Select>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              Upload Resource
            </Button>
          </Space>
        }
      >
        {viewMode === 'list' ? (
          <Table
            columns={columns}
            dataSource={filteredResources}
            rowKey="key"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
            }}
            scroll={{ x: 'max-content' }}
          />
        ) : (
          filteredResources.length > 0 ? (
            renderGridView()
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <FileUnknownOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
              <p style={{ color: '#999' }}>No resources found in this category</p>
              <Button
                type="primary"
                onClick={() => setIsModalVisible(true)}
              >
                Upload Your First Resource
              </Button>
            </div>
          )
        )}
      </Card>

      {/* Upload Modal */}
      <Modal
        title="Upload Resource"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setFileList([]);
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="Resource Name"
            rules={[{ required: true, message: 'Please enter resource name' }]}
          >
            <Input placeholder="Enter resource name" />
          </Form.Item>

          <Form.Item
            name="file"
            label="Select File"
            rules={[{ required: true, message: 'Please select a file' }]}
          >
            <Upload
              beforeUpload={beforeUpload}
              onChange={handleFileChange}
              fileList={fileList}
              maxCount={1}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.webm,.ogg,.mp3,.wav,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
            >
              <Button icon={<UploadOutlined />}>Select File (Max 100MB)</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="class_level"
            label="Class Level"
          >
            <Select placeholder="Select class level (optional)" allowClear>
              <Option value="Nursery">Nursery</Option>
              <Option value="LKG">LKG</Option>
              <Option value="UKG">UKG</Option>
              <Option value="Grade 1">Grade 1</Option>
              <Option value="Grade 2">Grade 2</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="tags"
            label="Tags"
          >
            <Select
              mode="tags"
              placeholder="Add tags (press Enter to add)"
              style={{ width: '100%' }}
            >
              <Option value="worksheet">Worksheet</Option>
              <Option value="printable">Printable</Option>
              <Option value="activity">Activity</Option>
              <Option value="lesson-plan">Lesson Plan</Option>
              <Option value="assessment">Assessment</Option>
              <Option value="template">Template</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea
              rows={3}
              placeholder="Enter a brief description (optional)"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                onClick={handleUpload}
                loading={uploading}
                disabled={fileList.length === 0}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                  setFileList([]);
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title={
          <div>
            {previewResource?.name}
            <div style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
              {previewResource?.file_type} •
              {previewResource?.file_size < 1024 * 1024
                ? ` ${(previewResource?.file_size / 1024).toFixed(1)} KB`
                : ` ${(previewResource?.file_size / (1024 * 1024)).toFixed(2)} MB`}
            </div>
          </div>
        }
        open={isPreviewModalVisible}
        onCancel={() => {
          // Pause video if playing
          if (previewResource?.file_type?.includes('video') && videoRefs.current[previewResource.resource_id]) {
            videoRefs.current[previewResource.resource_id].pause();
          }
          setIsPreviewModalVisible(false);
          setPreviewResource(null);
          setPreviewLoading(false);
          setIsEditingLogo(false);
          setIsEditingText(false);
          setIsDraggingText(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsPreviewModalVisible(false);
              setPreviewResource(null);
              setPreviewLoading(false);
              setIsEditingLogo(false);
              setIsEditingText(false);
              setIsDraggingText(null);
            }}
          >
            Close
          </Button>,
          category !== 'multimedia' && logoUrl && (
            <>
              {isEditingLogo ? (
                <>
                  <Button
                    key="saveLogo"
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={saveLogoPosition}
                    loading={positionLoading}
                  >
                    Save Logo Position
                  </Button>
                  <Button
                    key="resetLogo"
                    icon={<UndoOutlined />}
                    onClick={resetLogoPosition}
                    disabled={isDefaultPosition}
                  >
                    Reset Logo
                  </Button>
                </>
              ) : (
                <Button
                  key="editLogo"
                  icon={<EditOutlined />}
                  onClick={() => setIsEditingLogo(true)}
                >
                  Position Logo
                </Button>
              )}
            </>
          ),
          category !== 'multimedia' && (schoolInfo.school_name || schoolInfo.email || schoolInfo.contact_number) && (
            <>
              {isEditingText ? (
                <>
                  <Button
                    key="saveText"
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={saveTextPosition}
                  >
                    Save Text Position
                  </Button>
                  <Button
                    key="resetText"
                    icon={<UndoOutlined />}
                    onClick={resetTextPosition}
                    disabled={isDefaultText}
                  >
                    Reset Text
                  </Button>
                </>
              ) : (
                <Button
                  key="editText"
                  icon={<EditOutlined />}
                  onClick={() => setIsEditingText(true)}
                >
                  Position Text
                </Button>
              )}
            </>
          ),
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => {
              handleDownload(previewResource);
            }}
            disabled={previewResource?.is_own_upload && previewResource?.display_status !== 'approved'}
          >
            Download with branding
          </Button>
        ].filter(Boolean)}
        width="90%"
        style={{ top: 20 }}
        bodyStyle={{ 
          padding: 0, 
          height: '70vh', 
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        destroyOnClose
      >
        {renderPreview()}
      </Modal>
    </div>
  );
};

export default SchoolResourceCategory;