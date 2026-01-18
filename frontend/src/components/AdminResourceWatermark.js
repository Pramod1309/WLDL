import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Checkbox,
  Row,
  Col,
  message,
  Spin,
  Tabs,
  Tooltip,
  Divider,
  Slider,
  Tag,
  Progress,
  Modal,
  Badge,
  Image,
  Radio,
  Typography
} from 'antd';
import {
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
  SettingOutlined,
  CheckSquareOutlined,
  PlusOutlined,
  MinusOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileImageOutlined,
  FileOutlined,
  LoadingOutlined,
  LeftOutlined,
  RightOutlined,
  ExpandOutlined,
  DragOutlined,
  CloseOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const { TabPane } = Tabs;
const { Option } = Select;
const { Text, Paragraph } = Typography;

const AdminResourceWatermark = () => {
  const [resources, setResources] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedResources, setSelectedResources] = useState([]);
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [selectAllSchools, setSelectAllSchools] = useState(false);
  const [watermarkPositions, setWatermarkPositions] = useState({
    logo_x: 50,
    logo_y: 10,
    logo_width: 20,
    logo_opacity: 0.7,
    school_name_x: 50,
    school_name_y: 20,
    school_name_size: 16,
    school_name_opacity: 0.9,
    contact_x: 50,
    contact_y: 90,
    contact_size: 12,
    contact_opacity: 0.8
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(null);
  const [activeElement, setActiveElement] = useState('logo');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [totalToDownload, setTotalToDownload] = useState(0);
  const [activeTab, setActiveTab] = useState('1');
  const [selectedPreviewSchool, setSelectedPreviewSchool] = useState(null);
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  const [previewFileType, setPreviewFileType] = useState(null);
  const [showWatermarkOverlay, setShowWatermarkOverlay] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const previewContainerRef = useRef(null);
  const iframeRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    fetchResources();
    fetchSchools();
    fetchCategories();
  }, []);

  // Set up global mouse event listeners for dragging
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(null);
    };

    const handleMouseMove = (e) => {
      if (!isDragging || !previewContainerRef.current) return;

      const container = previewContainerRef.current;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const boundedX = Math.max(0, Math.min(100, x));
      const boundedY = Math.max(0, Math.min(100, y));

      setWatermarkPositions(prev => {
        switch (activeElement) {
          case 'logo':
            return { ...prev, logo_x: boundedX, logo_y: boundedY };
          case 'schoolName':
            return { ...prev, school_name_x: boundedX, school_name_y: boundedY };
          case 'contact':
            return { ...prev, contact_x: boundedX, contact_y: boundedY };
          default:
            return prev;
        }
      });
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging, activeElement]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/resources`);
      setResources(response.data.map(resource => ({
        ...resource,
        selected: false
      })));
    } catch (error) {
      console.error('Error fetching resources:', error);
      message.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await axios.get(`${API}/admin/schools`);
      setSchools(response.data.map(school => ({
        ...school,
        selected: false
      })));
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const categories = ['academic', 'marketing', 'administrative', 'training', 'event', 'multimedia'];
      setCategories(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleResourceSelect = (resourceId, checked) => {
    setSelectedResources(prev => {
      if (checked) {
        return [...prev, resourceId];
      } else {
        return prev.filter(id => id !== resourceId);
      }
    });
  };

  const handleSelectAllResources = (checked) => {
    if (checked) {
      const allResourceIds = resources.map(resource => resource.resource_id);
      setSelectedResources(allResourceIds);
    } else {
      setSelectedResources([]);
    }
  };

  const handleSchoolSelect = (schoolId, checked) => {
    if (checked) {
      setSelectedSchools([...selectedSchools, schoolId]);
    } else {
      setSelectedSchools(selectedSchools.filter(id => id !== schoolId));
    }
  };

  const handleSelectAllSchools = (checked) => {
    setSelectAllSchools(checked);
    if (checked) {
      setSelectedSchools(schools.map(school => school.school_id));
    } else {
      setSelectedSchools([]);
    }
  };

  // FIXED: Properly define generatePreview function
  const generatePreview = async () => {
    if (selectedResources.length === 0) {
      message.warning('Please select at least one resource');
      return;
    }

    if (selectedSchools.length === 0 && !selectAllSchools) {
      message.warning('Please select at least one school');
      return;
    }

    // For preview, take the first selected resource
    const resource = resources.find(r => r.resource_id === selectedResources[0]);
    if (!resource) {
      message.warning('Selected resource not found');
      return;
    }

    // Take the first selected school for preview
    const schoolId = selectAllSchools 
      ? schools[0]?.school_id 
      : selectedSchools[0];
    
    if (!schoolId) {
      message.warning('No school selected');
      return;
    }

    setPreviewLoading(true);
    
    try {
      const requestData = {
        resource_id: resource.resource_id,
        school_ids: [schoolId],
        positions: watermarkPositions
      };

      console.log('Sending preview request:', requestData);

      const response = await axios.post(
        `${API}/admin/generate-watermark-preview`,
        requestData,
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Create object URL for the preview
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/pdf' 
      });
      
      // Revoke previous URL if exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      const newPreviewUrl = URL.createObjectURL(blob);
      setPreviewUrl(newPreviewUrl);
      
      // Determine file type for rendering
      const contentType = response.headers['content-type'] || '';
      setPreviewFileType(contentType.includes('image') ? 'image' : 
                        contentType.includes('pdf') ? 'pdf' : 'other');
      
      // Also add to previews array for navigation
      const school = schools.find(s => s.school_id === schoolId);
      setPreviews([{
        resourceId: resource.resource_id,
        resource,
        schoolId,
        schoolName: school?.school_name || 'Unknown School',
        blobUrl: newPreviewUrl,
        isPdf: contentType.includes('pdf'),
        isImage: contentType.includes('image'),
        isVideo: contentType.includes('video'),
        isFallback: false,
        error: false,
        loaded: true
      }]);
      
      message.success('Preview generated successfully');
      
    } catch (error) {
      console.error('Error generating preview:', error);
      message.error(error.response?.data?.detail || 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  // FIXED: Properly define generateAllPreviews function
  const generateAllPreviews = async () => {
    if (selectedResources.length === 0) {
      message.warning('Please select at least one resource');
      return;
    }

    setPreviewLoading(true);
    
    try {
      const previewPromises = [];
      
      // For each selected resource, generate preview
      for (const resourceId of selectedResources) {
        const resource = resources.find(r => r.resource_id === resourceId);
        if (!resource) continue;

        // Take first school for preview
        const schoolId = selectAllSchools 
          ? schools[0]?.school_id 
          : selectedSchools[0];
        
        if (!schoolId) continue;

        previewPromises.push(
          axios.post(
            `${API}/admin/generate-watermark-preview`,
            {
              resource_id: resource.resource_id,
              school_ids: [schoolId],
              positions: watermarkPositions
            },
            {
              responseType: 'blob',
              headers: { 'Content-Type': 'application/json' }
            }
          ).then(response => ({
            resourceId: resource.resource_id,
            resource,
            schoolId,
            schoolName: schools.find(s => s.school_id === schoolId)?.school_name || 'Unknown School',
            blob: response.data,
            contentType: response.headers['content-type'] || 'application/pdf'
          })).catch(error => ({
            resourceId: resource.resource_id,
            resource,
            schoolId,
            error: true,
            errorMessage: error.response?.data?.detail || 'Failed to generate preview'
          }))
        );
      }

      const results = await Promise.all(previewPromises);
      
      // Process results
      const processedPreviews = results.map(result => {
        if (result.error) {
          return {
            resourceId: result.resourceId,
            resource: result.resource,
            schoolId: result.schoolId,
            error: true,
            errorMessage: result.errorMessage,
            loaded: true
          };
        }

        const blob = new Blob([result.blob], { 
          type: result.contentType 
        });
        const blobUrl = URL.createObjectURL(blob);
        
        return {
          resourceId: result.resourceId,
          resource: result.resource,
          schoolId: result.schoolId,
          schoolName: result.schoolName,
          blobUrl,
          isPdf: result.contentType.includes('pdf'),
          isImage: result.contentType.includes('image'),
          isVideo: result.contentType.includes('video'),
          isFallback: false,
          error: false,
          loaded: true
        };
      });

      setPreviews(processedPreviews);
      setCurrentPreviewIndex(0);
      
      if (processedPreviews.some(p => p.error)) {
        message.warning('Some previews failed to generate. Check individual previews for details.');
      } else {
        message.success(`Generated ${processedPreviews.length} preview(s) successfully`);
      }
      
    } catch (error) {
      console.error('Error generating all previews:', error);
      message.error('Failed to generate previews');
    } finally {
      setPreviewLoading(false);
    }
  };

  // FIXED: Properly define renderPreview function
  const renderPreview = () => {
    if (previewLoading || previews.length === 0) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '500px',
          color: '#666'
        }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
          <p style={{ marginTop: '16px' }}>
            {previewLoading ? 'Generating preview...' : 'No preview generated yet'}
          </p>
          {previews.length === 0 && !previewLoading && (
            <Button 
              type="primary" 
              icon={<EyeOutlined />} 
              onClick={generatePreview}
              style={{ marginTop: '16px' }}
            >
              Generate Preview
            </Button>
          )}
        </div>
      );
    }

    const currentPreview = previews[currentPreviewIndex];
    if (!currentPreview) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '500px',
          color: '#ff4d4f'
        }}>
          <CloseOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <p>Preview not found</p>
        </div>
      );
    }

    if (currentPreview.error) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '500px',
          color: '#ff4d4f',
          padding: '20px',
          textAlign: 'center'
        }}>
          <CloseOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
            Failed to Load Preview
          </p>
          <p style={{ fontSize: '14px', marginBottom: '16px' }}>
            {currentPreview.errorMessage}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={generateAllPreviews}
            >
              Retry
            </Button>
            <Button 
              onClick={() => {
                // Remove this preview from the list
                setPreviews(prev => prev.filter((_, idx) => idx !== currentPreviewIndex));
                if (currentPreviewIndex >= previews.length - 1) {
                  setCurrentPreviewIndex(Math.max(0, previews.length - 2));
                }
              }}
            >
              Skip This Resource
            </Button>
          </div>
        </div>
      );
    }

    // Check if preview is loaded
    if (!currentPreview.loaded || !currentPreview.blobUrl) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '500px',
          color: '#666'
        }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
          <p style={{ marginTop: '16px' }}>Loading preview...</p>
        </div>
      );
    }

    // Show fallback warning if needed
    const showFallbackWarning = currentPreview.isFallback;

    // Render based on file type
    if (currentPreview.isPdf) {
      return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {showFallbackWarning && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              right: '10px',
              backgroundColor: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: '4px',
              padding: '8px 12px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <InfoCircleOutlined style={{ color: '#fa8c16' }} />
              <span style={{ fontSize: '12px', color: '#fa8c16' }}>
                Showing original PDF (watermark preview failed). Watermarks will be applied when downloading.
              </span>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={`${currentPreview.blobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: 'white'
            }}
            title={`Watermarked PDF Preview: ${currentPreview.resource.name}`}
          />
        </div>
      );
    }

    if (currentPreview.isImage) {
      return (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          background: '#f5f5f5',
          position: 'relative'
        }}>
          {showFallbackWarning && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              right: '10px',
              backgroundColor: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: '4px',
              padding: '8px 12px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <InfoCircleOutlined style={{ color: '#fa8c16' }} />
              <span style={{ fontSize: '12px', color: '#fa8c16' }}>
                Showing original image (watermark preview failed). Watermarks will be applied when downloading.
              </span>
            </div>
          )}
          <img
            src={currentPreview.blobUrl}
            alt={`Watermarked preview: ${currentPreview.resource.name}`}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%', 
              objectFit: 'contain' 
            }}
          />
        </div>
      );
    }

    if (currentPreview.isVideo) {
      return (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          background: '#000',
          position: 'relative'
        }}>
          {showFallbackWarning && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              right: '10px',
              backgroundColor: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: '4px',
              padding: '8px 12px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <InfoCircleOutlined style={{ color: '#fa8c16' }} />
              <span style={{ fontSize: '12px', color: '#fa8c16' }}>
                Showing original video (watermark preview failed)
              </span>
            </div>
          )}
          <video
            ref={videoRef}
            src={currentPreview.blobUrl}
            controls
            style={{
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          />
        </div>
      );
    }

    // For other file types (Word, Excel, PPT, etc.)
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        background: '#f5f5f5',
        padding: '20px'
      }}>
        <div style={{ 
          width: '100%', 
          maxWidth: '600px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '24px',
          textAlign: 'center'
        }}>
          {getFileIcon(currentPreview.resource.file_type, 64)}
          
          <h3 style={{ marginTop: '16px', marginBottom: '8px' }}>
            {currentPreview.resource.name}
          </h3>
          
          <div style={{ marginBottom: '16px', color: '#666' }}>
            <div style={{ fontSize: '14px', marginBottom: '4px' }}>
              {currentPreview.resource.file_type || 'Document'}
            </div>
            <div style={{ fontSize: '12px' }}>
              {currentPreview.resource.file_size < 1024 * 1024
                ? `${(currentPreview.resource.file_size / 1024).toFixed(1)} KB`
                : `${(currentPreview.resource.file_size / (1024 * 1024)).toFixed(2)} MB`}
            </div>
          </div>

          {showFallbackWarning ? (
            <>
              <div style={{
                backgroundColor: '#fffbe6',
                border: '1px solid #ffe58f',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '16px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <InfoCircleOutlined style={{ color: '#fa8c16', marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fa8c16', marginBottom: '4px' }}>
                      Showing Original File
                    </div>
                    <div style={{ fontSize: '12px', color: '#fa8c16' }}>
                      Watermark preview failed. Watermarks will be applied when downloading.
                    </div>
                  </div>
                </div>
              </div>
              
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                size="large"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = currentPreview.blobUrl;
                  a.download = `${currentPreview.resource.name}_original`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                style={{ marginBottom: '8px' }}
              >
                Download Original File
              </Button>
            </>
          ) : (
            <>
              <div style={{
                backgroundColor: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span style={{ fontSize: '12px', color: '#52c41a' }}>
                    Watermarked preview generated successfully
                  </span>
                </div>
              </div>
              
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                size="large"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = currentPreview.blobUrl;
                  a.download = `${currentPreview.resource.name}_watermarked`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                style={{ marginBottom: '8px' }}
              >
                Download Watermarked File
              </Button>
            </>
          )}
          
          <div style={{ marginTop: '16px', fontSize: '12px', color: '#999' }}>
            <p>Some file types cannot be displayed inline in the browser.</p>
            <p>Download the file to see the watermarked version.</p>
          </div>
        </div>
      </div>
    );
  };

  const nextPreview = () => {
    if (currentPreviewIndex < previews.length - 1) {
      setCurrentPreviewIndex(currentPreviewIndex + 1);
    }
  };

  const prevPreview = () => {
    if (currentPreviewIndex > 0) {
      setCurrentPreviewIndex(currentPreviewIndex - 1);
    }
  };

  const getFileIcon = (fileType, size = 24) => {
    if (!fileType) return <FileOutlined style={{ fontSize: `${size}px` }} />;
    
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: `${size}px` }} />;
    if (type.includes('word') || type.includes('doc')) return <FileWordOutlined style={{ color: '#1890ff', fontSize: `${size}px` }} />;
    if (type.includes('powerpoint') || type.includes('ppt')) return <FilePptOutlined style={{ color: '#ffa940', fontSize: `${size}px` }} />;
    if (type.includes('excel') || type.includes('xls')) return <FileExcelOutlined style={{ color: '#52c41a', fontSize: `${size}px` }} />;
    if (type.includes('image')) return <FileImageOutlined style={{ color: '#722ed1', fontSize: `${size}px` }} />;
    if (type.includes('video')) return <PlayCircleOutlined style={{ color: '#13c2c2', fontSize: `${size}px` }} />;
    
    return <FileOutlined style={{ fontSize: `${size}px` }} />;
  };

  const saveWatermarkTemplate = async () => {
    if (selectedResources.length === 0) {
      message.warning('Please select at least one resource');
      return;
    }

    try {
      const promises = selectedResources.map(resourceId => 
        axios.post(`${API}/admin/save-watermark-template`, {
          admin_id: 'admin',
          resource_id: resourceId,
          positions: watermarkPositions,
          is_for_all: selectAllSchools
        })
      );

      await Promise.all(promises);
      message.success(`Watermark template saved for ${selectedResources.length} resource(s)`);
    } catch (error) {
      console.error('Error saving template:', error);
      message.error(error.response?.data?.detail || 'Failed to save template');
    }
  };

  const downloadWatermarkedResources = async () => {
    if (selectedResources.length === 0) {
      message.warning('Please select at least one resource');
      return;
    }

    if (selectedSchools.length === 0 && !selectAllSchools) {
      message.warning('Please select at least one school');
      return;
    }

    // For now, handle one resource at a time
    const resource = resources.find(r => r.resource_id === selectedResources[0]);
    if (!resource) {
      message.warning('Selected resource not found');
      return;
    }

    const schoolsToProcess = selectAllSchools 
      ? schools 
      : schools.filter(s => selectedSchools.includes(s.school_id));

    setTotalToDownload(schoolsToProcess.length);
    setBatchDownloading(true);
    setDownloadProgress(0);

    try {
      const response = await axios.post(
        `${API}/admin/download-batch-watermarked`,
        {
          resource_id: resource.resource_id,
          school_ids: selectAllSchools ? 'all' : selectedSchools,
          positions: watermarkPositions
        },
        { 
          responseType: 'blob',
          timeout: 60000 // 60 second timeout for large batches
        }
      );

      // Create download link
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resource.name.replace(/\s+/g, '_')}_watermarked_schools.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      message.success(`Downloaded ${schoolsToProcess.length} watermarked resources`);
    } catch (error) {
      console.error('Error downloading batch:', error);
      if (error.response?.data?.detail) {
        message.error(`Error: ${error.response.data.detail}`);
      } else {
        message.error('Failed to download watermarked resources');
      }
    } finally {
      setBatchDownloading(false);
      setDownloadProgress(0);
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle watermark overlay controls
  const handleSizeChange = (element, change) => {
    switch (element) {
      case 'logo':
        setWatermarkPositions(prev => ({
          ...prev,
          logo_width: Math.max(5, Math.min(50, prev.logo_width + change))
        }));
        break;
      case 'schoolName':
        setWatermarkPositions(prev => ({
          ...prev,
          school_name_size: Math.max(10, Math.min(30, prev.school_name_size + change))
        }));
        break;
      case 'contact':
        setWatermarkPositions(prev => ({
          ...prev,
          contact_size: Math.max(8, Math.min(20, prev.contact_size + change))
        }));
        break;
    }
  };

  const handleOpacityChange = (element, change) => {
    switch (element) {
      case 'logo':
        setWatermarkPositions(prev => ({
          ...prev,
          logo_opacity: Math.max(0.1, Math.min(1.0, prev.logo_opacity + change))
        }));
        break;
      case 'schoolName':
        setWatermarkPositions(prev => ({
          ...prev,
          school_name_opacity: Math.max(0.1, Math.min(1.0, prev.school_name_opacity + change))
        }));
        break;
      case 'contact':
        setWatermarkPositions(prev => ({
          ...prev,
          contact_opacity: Math.max(0.1, Math.min(1.0, prev.contact_opacity + change))
        }));
        break;
    }
  };

  return (
    <div>
      <Card
        title={
          <div>
            <h2 style={{ margin: 0 }}>Batch Watermark Resources</h2>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Add school branding to multiple resources for multiple schools
            </p>
          </div>
        }
        extra={
          <Space>
            <Input
              placeholder="Search resources..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: 150 }}
              placeholder="Filter by category"
            >
              <Option value="all">All Categories</Option>
              {categories.map(category => (
                <Option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Option>
              ))}
            </Select>
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Step 1: Select Resources */}
          <TabPane tab="1. Select Resources" key="1">
            <div style={{ marginBottom: '16px' }}>
              <Checkbox
                checked={selectedResources.length === filteredResources.length && filteredResources.length > 0}
                onChange={(e) => handleSelectAllResources(e.target.checked)}
                indeterminate={selectedResources.length > 0 && selectedResources.length < filteredResources.length}
              >
                <strong>Select All ({filteredResources.length} resources)</strong>
              </Checkbox>
              <Badge 
                count={selectedResources.length} 
                showZero 
                style={{ 
                  marginLeft: '16px', 
                  backgroundColor: '#1890ff',
                  fontSize: '12px'
                }} 
              />
              <span style={{ marginLeft: '8px', fontSize: '14px' }}>
                resource(s) selected
              </span>
            </div>

            <Table
              columns={[
                {
                  title: '',
                  key: 'selection',
                  width: 50,
                  render: (_, record) => (
                    <Checkbox
                      checked={selectedResources.includes(record.resource_id)}
                      onChange={(e) => handleResourceSelect(record.resource_id, e.target.checked)}
                    />
                  )
                },
                {
                  title: 'Resource',
                  dataIndex: 'name',
                  key: 'name',
                  render: (text, record) => (
                    <Space>
                      {getFileIcon(record.file_type)}
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{text}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {record.category} • {record.file_type?.split('/').pop() || 'File'}
                        </div>
                      </div>
                    </Space>
                  ),
                },
                {
                  title: 'Size',
                  dataIndex: 'file_size',
                  key: 'file_size',
                  render: (size) => {
                    if (!size) return '-';
                    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
                    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
                  },
                  width: 100,
                },
                {
                  title: 'Downloads',
                  dataIndex: 'download_count',
                  key: 'download_count',
                  render: (count) => <Badge count={count || 0} showZero style={{ backgroundColor: '#52c41a' }} />,
                  width: 100,
                },
                {
                  title: 'Status',
                  key: 'status',
                  render: (_, record) => (
                    <Tag color={record.approval_status === 'approved' ? 'green' : 'orange'}>
                      {record.approval_status}
                    </Tag>
                  ),
                  width: 100,
                },
              ]}
              dataSource={filteredResources}
              rowKey="resource_id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              rowClassName={(record) => 
                selectedResources.includes(record.resource_id) ? 'selected-row' : ''
              }
            />

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <Button 
                type="primary" 
                onClick={() => setActiveTab('2')}
                disabled={selectedResources.length === 0}
              >
                Next: Select Schools ({selectedResources.length} selected)
              </Button>
            </div>
          </TabPane>

          {/* Step 2: Select Schools */}
          <TabPane tab="2. Select Schools" key="2" disabled={selectedResources.length === 0}>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <Checkbox
                  checked={selectAllSchools}
                  onChange={(e) => handleSelectAllSchools(e.target.checked)}
                >
                  <strong>Select All Schools ({schools.length} schools)</strong>
                </Checkbox>
                <Badge 
                  count={selectAllSchools ? schools.length : selectedSchools.length} 
                  showZero 
                  style={{ 
                    marginLeft: '16px', 
                    backgroundColor: '#1890ff',
                    fontSize: '12px'
                  }} 
                />
                <span style={{ marginLeft: '8px', fontSize: '14px' }}>
                  school(s) selected
                </span>
              </div>

              <Divider />

              <Row gutter={[16, 16]}>
                {schools.map(school => (
                  <Col xs={24} sm={12} md={8} lg={6} key={school.school_id}>
                    <Card
                      size="small"
                      style={{
                        border: selectedSchools.includes(school.school_id) || selectAllSchools
                          ? '2px solid #1890ff' 
                          : '1px solid #f0f0f0',
                        cursor: 'pointer',
                        opacity: selectAllSchools ? 0.7 : 1,
                        transition: 'all 0.2s'
                      }}
                      onClick={() => {
                        if (!selectAllSchools) {
                          const isSelected = selectedSchools.includes(school.school_id);
                          handleSchoolSelect(school.school_id, !isSelected);
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Checkbox
                          checked={selectAllSchools || selectedSchools.includes(school.school_id)}
                          disabled={selectAllSchools}
                          onChange={(e) => handleSchoolSelect(school.school_id, e.target.checked)}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{school.school_name}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>ID: {school.school_id}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>{school.email}</div>
                          {school.contact_number && (
                            <div style={{ fontSize: '12px', color: '#666' }}>📞 {school.contact_number}</div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={() => setActiveTab('1')}>Back to Resources</Button>
                <Button 
                  type="primary" 
                  onClick={() => setActiveTab('3')}
                  disabled={selectedSchools.length === 0 && !selectAllSchools}
                >
                  Next: Customize Watermark
                </Button>
              </div>
            </div>
          </TabPane>

          {/* Step 3: Customize Watermark */}
          <TabPane tab="3. Customize Watermark" key="3" 
            disabled={selectedResources.length === 0 || (selectedSchools.length === 0 && !selectAllSchools)}
          >
            <div style={{ display: 'flex', gap: '20px', minHeight: '600px' }}>
              {/* Preview Section */}
              <div style={{ flex: 2 }}>
                <Card 
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span>Resource Preview</span>
                        {previews.length > 0 && (
                          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
                            ({currentPreviewIndex + 1} of {previews.length})
                          </span>
                        )}
                      </div>
                      <div>
                        {previews.length > 0 && (
                          <Space>
                            <Button
                              size="small"
                              icon={<LeftOutlined />}
                              onClick={prevPreview}
                              disabled={currentPreviewIndex === 0}
                            />
                            <Button
                              size="small"
                              icon={<RightOutlined />}
                              onClick={nextPreview}
                              disabled={currentPreviewIndex === previews.length - 1}
                            />
                            <Button
                              size="small"
                              icon={<ExpandOutlined />}
                              onClick={() => setFullscreenPreview(true)}
                            />
                          </Space>
                        )}
                      </div>
                    </div>
                  }
                  style={{ height: '100%' }}
                  bodyStyle={{ 
                    padding: 0, 
                    height: 'calc(100% - 57px)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    ref={previewContainerRef}
                    style={{
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      backgroundColor: '#f5f5f5',
                      cursor: isDragging ? 'grabbing' : 'default'
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {renderPreview()}

                    {/* Watermark overlay elements for positioning */}
                    {isEditing && previews.length > 0 && showWatermarkOverlay && (
                      <>
                        {/* Logo overlay */}
                        <div
                          style={{
                            position: 'absolute',
                            left: `${watermarkPositions.logo_x}%`,
                            top: `${watermarkPositions.logo_y}%`,
                            width: `${watermarkPositions.logo_width * 5}px`,
                            height: `${watermarkPositions.logo_width * 2.5}px`,
                            backgroundColor: 'rgba(24, 144, 255, 0.3)',
                            border: activeElement === 'logo' ? '2px solid #1890ff' : '1px dashed #ccc',
                            borderRadius: '4px',
                            transform: 'translate(-50%, -50%)',
                            cursor: isDragging === 'logo' ? 'grabbing' : 'grab',
                            pointerEvents: 'auto',
                            opacity: watermarkPositions.logo_opacity,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#1890ff',
                            fontWeight: 'bold',
                            fontSize: '10px',
                            textAlign: 'center',
                            padding: '4px',
                            zIndex: 1000
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveElement('logo');
                            setIsDragging('logo');
                          }}
                        >
                          <DragOutlined />
                          LOGO
                        </div>

                        {/* School Name overlay */}
                        <div
                          style={{
                            position: 'absolute',
                            left: `${watermarkPositions.school_name_x}%`,
                            top: `${watermarkPositions.school_name_y}%`,
                            fontSize: `${watermarkPositions.school_name_size}px`,
                            color: '#000',
                            backgroundColor: 'rgba(82, 196, 26, 0.3)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            transform: 'translate(-50%, -50%)',
                            cursor: isDragging === 'schoolName' ? 'grabbing' : 'grab',
                            pointerEvents: 'auto',
                            opacity: watermarkPositions.school_name_opacity,
                            border: activeElement === 'schoolName' ? '2px solid #52c41a' : '1px dashed #ccc',
                            whiteSpace: 'nowrap',
                            zIndex: 1000
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveElement('schoolName');
                            setIsDragging('schoolName');
                          }}
                        >
                          School Name
                        </div>

                        {/* Contact Info overlay */}
                        <div
                          style={{
                            position: 'absolute',
                            left: `${watermarkPositions.contact_x}%`,
                            top: `${watermarkPositions.contact_y}%`,
                            fontSize: `${watermarkPositions.contact_size}px`,
                            color: '#000',
                            backgroundColor: 'rgba(250, 140, 22, 0.3)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            transform: 'translate(-50%, -50%)',
                            cursor: isDragging === 'contact' ? 'grabbing' : 'grab',
                            pointerEvents: 'auto',
                            opacity: watermarkPositions.contact_opacity,
                            border: activeElement === 'contact' ? '2px solid #fa8c16' : '1px dashed #ccc',
                            textAlign: 'center',
                            zIndex: 1000
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveElement('contact');
                            setIsDragging('contact');
                          }}
                        >
                          Contact Info
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={generateAllPreviews}
                    disabled={selectedResources.length === 0}
                    loading={previewLoading}
                  >
                    Generate Preview ({selectedResources.length})
                  </Button>
                  <Button
                    type={isEditing ? 'primary' : 'default'}
                    icon={isEditing ? <CheckSquareOutlined /> : <SettingOutlined />}
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={previews.length === 0}
                  >
                    {isEditing ? 'Done Editing' : 'Edit Positions'}
                  </Button>
                  <Checkbox
                    checked={showWatermarkOverlay}
                    onChange={(e) => setShowWatermarkOverlay(e.target.checked)}
                    disabled={!isEditing}
                  >
                    Show Overlay
                  </Checkbox>
                  <Button
                    type="default"
                    icon={<DownloadOutlined />}
                    onClick={saveWatermarkTemplate}
                    disabled={selectedResources.length === 0}
                  >
                    Save Template
                  </Button>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={downloadWatermarkedResources}
                    disabled={selectedResources.length === 0}
                    loading={batchDownloading}
                  >
                    {batchDownloading ? 'Downloading...' : 'Download All as ZIP'}
                  </Button>
                  <Button onClick={() => setActiveTab('2')}>
                    Back to Schools
                  </Button>
                </div>

                {/* Preview Navigation */}
                {previews.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                      Previewing: {previews[currentPreviewIndex]?.resource?.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Button
                        size="small"
                        icon={<LeftOutlined />}
                        onClick={prevPreview}
                        disabled={currentPreviewIndex === 0}
                      />
                      <div style={{ flex: 1, display: 'flex', gap: '4px', overflowX: 'auto', padding: '8px 0' }}>
                        {previews.map((preview, index) => (
                          <div
                            key={preview.resourceId}
                            style={{
                              minWidth: '80px',
                              height: '60px',
                              border: index === currentPreviewIndex ? '2px solid #1890ff' : '1px solid #d9d9d9',
                              borderRadius: '4px',
                              backgroundColor: preview.error ? '#fff2f0' : '#fafafa',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              padding: '4px',
                              position: 'relative'
                            }}
                            onClick={() => setCurrentPreviewIndex(index)}
                          >
                            {preview.error ? (
                              <CloseOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
                            ) : (
                              getFileIcon(preview.resource.file_type, 16)
                            )}
                            <div style={{
                              fontSize: '10px',
                              marginTop: '4px',
                              textAlign: 'center',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              width: '100%',
                              color: preview.error ? '#ff4d4f' : '#666'
                            }}>
                              {preview.resource.name.substring(0, 10)}...
                            </div>
                            {preview.isFallback && !preview.error && (
                              <div style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                width: '8px',
                                height: '8px',
                                backgroundColor: '#fa8c16',
                                borderRadius: '50%'
                              }} />
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        size="small"
                        icon={<RightOutlined />}
                        onClick={nextPreview}
                        disabled={currentPreviewIndex === previews.length - 1}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Controls Section */}
              <div style={{ flex: 1, minWidth: '300px' }}>
                <Card title="Watermark Controls" size="small">
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Selected Element:</div>
                    <Space>
                      <Button
                        type={activeElement === 'logo' ? 'primary' : 'default'}
                        onClick={() => setActiveElement('logo')}
                        size="small"
                      >
                        Logo
                      </Button>
                      <Button
                        type={activeElement === 'schoolName' ? 'primary' : 'default'}
                        onClick={() => setActiveElement('schoolName')}
                        size="small"
                      >
                        School Name
                      </Button>
                      <Button
                        type={activeElement === 'contact' ? 'primary' : 'default'}
                        onClick={() => setActiveElement('contact')}
                        size="small"
                      >
                        Contact Info
                      </Button>
                    </Space>
                  </div>

                  {activeElement === 'logo' && (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ marginBottom: '8px' }}>Logo Size: {watermarkPositions.logo_width}%</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Button 
                            size="small" 
                            icon={<MinusOutlined />}
                            onClick={() => handleSizeChange('logo', -5)}
                            disabled={watermarkPositions.logo_width <= 5}
                          />
                          <Slider
                            style={{ flex: 1 }}
                            min={5}
                            max={50}
                            value={watermarkPositions.logo_width}
                            onChange={(value) => setWatermarkPositions(prev => ({ ...prev, logo_width: value }))}
                          />
                          <Button 
                            size="small" 
                            icon={<PlusOutlined />}
                            onClick={() => handleSizeChange('logo', 5)}
                            disabled={watermarkPositions.logo_width >= 50}
                          />
                        </div>
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ marginBottom: '8px' }}>Logo Opacity: {(watermarkPositions.logo_opacity * 100).toFixed(0)}%</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Button 
                            size="small" 
                            icon={<MinusOutlined />}
                            onClick={() => handleOpacityChange('logo', -0.1)}
                            disabled={watermarkPositions.logo_opacity <= 0.1}
                          />
                          <Slider
                            style={{ flex: 1 }}
                            min={10}
                            max={100}
                            value={watermarkPositions.logo_opacity * 100}
                            onChange={(value) => setWatermarkPositions(prev => ({ ...prev, logo_opacity: value / 100 }))}
                          />
                          <Button 
                            size="small" 
                            icon={<PlusOutlined />}
                            onClick={() => handleOpacityChange('logo', 0.1)}
                            disabled={watermarkPositions.logo_opacity >= 1.0}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {activeElement === 'schoolName' && (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ marginBottom: '8px' }}>Font Size: {watermarkPositions.school_name_size}px</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Button 
                            size="small" 
                            icon={<MinusOutlined />}
                            onClick={() => handleSizeChange('schoolName', -2)}
                            disabled={watermarkPositions.school_name_size <= 10}
                          />
                          <Slider
                            style={{ flex: 1 }}
                            min={10}
                            max={30}
                            value={watermarkPositions.school_name_size}
                            onChange={(value) => setWatermarkPositions(prev => ({ ...prev, school_name_size: value }))}
                          />
                          <Button 
                            size="small" 
                            icon={<PlusOutlined />}
                            onClick={() => handleSizeChange('schoolName', 2)}
                            disabled={watermarkPositions.school_name_size >= 30}
                          />
                        </div>
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ marginBottom: '8px' }}>Opacity: {(watermarkPositions.school_name_opacity * 100).toFixed(0)}%</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Button 
                            size="small" 
                            icon={<MinusOutlined />}
                            onClick={() => handleOpacityChange('schoolName', -0.1)}
                            disabled={watermarkPositions.school_name_opacity <= 0.1}
                          />
                          <Slider
                            style={{ flex: 1 }}
                            min={10}
                            max={100}
                            value={watermarkPositions.school_name_opacity * 100}
                            onChange={(value) => setWatermarkPositions(prev => ({ ...prev, school_name_opacity: value / 100 }))}
                          />
                          <Button 
                            size="small" 
                            icon={<PlusOutlined />}
                            onClick={() => handleOpacityChange('schoolName', 0.1)}
                            disabled={watermarkPositions.school_name_opacity >= 1.0}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {activeElement === 'contact' && (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ marginBottom: '8px' }}>Font Size: {watermarkPositions.contact_size}px</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Button 
                            size="small" 
                            icon={<MinusOutlined />}
                            onClick={() => handleSizeChange('contact', -1)}
                            disabled={watermarkPositions.contact_size <= 8}
                          />
                          <Slider
                            style={{ flex: 1 }}
                            min={8}
                            max={20}
                            value={watermarkPositions.contact_size}
                            onChange={(value) => setWatermarkPositions(prev => ({ ...prev, contact_size: value }))}
                          />
                          <Button 
                            size="small" 
                            icon={<PlusOutlined />}
                            onClick={() => handleSizeChange('contact', 1)}
                            disabled={watermarkPositions.contact_size >= 20}
                          />
                        </div>
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ marginBottom: '8px' }}>Opacity: {(watermarkPositions.contact_opacity * 100).toFixed(0)}%</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Button 
                            size="small" 
                            icon={<MinusOutlined />}
                            onClick={() => handleOpacityChange('contact', -0.1)}
                            disabled={watermarkPositions.contact_opacity <= 0.1}
                          />
                          <Slider
                            style={{ flex: 1 }}
                            min={10}
                            max={100}
                            value={watermarkPositions.contact_opacity * 100}
                            onChange={(value) => setWatermarkPositions(prev => ({ ...prev, contact_opacity: value / 100 }))}
                          />
                          <Button 
                            size="small" 
                            icon={<PlusOutlined />}
                            onClick={() => handleOpacityChange('contact', 0.1)}
                            disabled={watermarkPositions.contact_opacity >= 1.0}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </Card>

                {/* Summary Section */}
                <Card title="Summary" size="small" style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '13px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Selected Resources:</strong> {selectedResources.length}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Selected Schools:</strong> {
                        selectAllSchools 
                          ? `All (${schools.length})` 
                          : `${selectedSchools.length}`
                      }
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Watermark Elements:</strong>
                      <div style={{ marginLeft: '8px', fontSize: '12px', marginTop: '4px' }}>
                        • Logo: {watermarkPositions.logo_x}%, {watermarkPositions.logo_y}% ({watermarkPositions.logo_width}%)
                      </div>
                      <div style={{ marginLeft: '8px', fontSize: '12px', marginTop: '2px' }}>
                        • School Name: {watermarkPositions.school_name_size}px
                      </div>
                      <div style={{ marginLeft: '8px', fontSize: '12px', marginTop: '2px' }}>
                        • Contact Info: {watermarkPositions.contact_size}px
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabPane>
        </Tabs>

        {/* Download Progress Indicator */}
        {batchDownloading && (
          <div style={{ 
            position: 'fixed', 
            bottom: '20px', 
            right: '20px', 
            backgroundColor: 'white', 
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '300px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Spin size="small" />
              <strong>Downloading...</strong>
            </div>
            <Progress
              percent={totalToDownload > 0 ? Math.round((downloadProgress / totalToDownload) * 100) : 0}
              size="small"
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              {downloadProgress} of {totalToDownload} schools processed
            </div>
          </div>
        )}

        {/* Fullscreen Preview Modal */}
        <Modal
          open={fullscreenPreview}
          onCancel={() => setFullscreenPreview(false)}
          footer={null}
          width="90%"
          style={{ top: 20 }}
          bodyStyle={{ padding: 0, height: '80vh' }}
        >
          {previews.length > 0 && (
            <div style={{ position: 'relative', height: '100%' }}>
              <div style={{ 
                position: 'absolute', 
                top: '10px', 
                right: '10px', 
                zIndex: 1001,
                display: 'flex',
                gap: '8px'
              }}>
                <Button
                  size="small"
                  icon={<LeftOutlined />}
                  onClick={prevPreview}
                  disabled={currentPreviewIndex === 0}
                />
                <Button
                  size="small"
                  icon={<RightOutlined />}
                  onClick={nextPreview}
                  disabled={currentPreviewIndex === previews.length - 1}
                />
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => setFullscreenPreview(false)}
                />
              </div>
              
              <div style={{ height: '100%', padding: '20px' }}>
                {renderPreview()}
              </div>
            </div>
          )}
        </Modal>
      </Card>

      <style>
        {`
          .selected-row {
            background-color: #f0f9ff !important;
          }
          .selected-row:hover {
            background-color: #e6f7ff !important;
          }
          .ant-table-tbody > tr.selected-row:hover > td {
            background-color: #e6f7ff !important;
          }
        `}
      </style>
    </div>
  );
};

export default AdminResourceWatermark;