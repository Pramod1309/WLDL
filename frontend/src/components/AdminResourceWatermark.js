import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Checkbox,
  Row,
  Col,
  message,
  Spin,
  Tabs,
  Upload,
  Tooltip,
  Divider,
  Slider,
  InputNumber,
  Tag,
  Progress
} from 'antd';
import {
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
  SettingOutlined,
  CheckSquareOutlined,
  BorderOutlined,
  PlusOutlined,
  MinusOutlined,
  EyeInvisibleOutlined,
  FilePdfOutlined,
  LoadingOutlined,
  UploadOutlined
} from '@ant-design/icons';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const { TabPane } = Tabs;
const { Option } = Select;

const AdminResourceWatermark = () => {
  const [resources, setResources] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
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
  const [previewImage, setPreviewImage] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [totalToDownload, setTotalToDownload] = useState(0);

  useEffect(() => {
    fetchResources();
    fetchSchools();
    fetchCategories();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/resources`);
      setResources(response.data);
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
      setSchools(response.data);
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

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedSchools(schools.map(school => school.school_id));
    } else {
      setSelectedSchools([]);
    }
  };

  const handleSchoolSelect = (schoolId, checked) => {
    if (checked) {
      setSelectedSchools([...selectedSchools, schoolId]);
    } else {
      setSelectedSchools(selectedSchools.filter(id => id !== schoolId));
    }
  };

  const handleDrag = (e, element) => {
    if (!isDragging || !element) return;

    const container = document.getElementById('preview-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const boundedX = Math.max(0, Math.min(100, x));
    const boundedY = Math.max(0, Math.min(100, y));

    switch (element) {
      case 'logo':
        setWatermarkPositions(prev => ({
          ...prev,
          logo_x: boundedX,
          logo_y: boundedY
        }));
        break;
      case 'schoolName':
        setWatermarkPositions(prev => ({
          ...prev,
          school_name_x: boundedX,
          school_name_y: boundedY
        }));
        break;
      case 'contact':
        setWatermarkPositions(prev => ({
          ...prev,
          contact_x: boundedX,
          contact_y: boundedY
        }));
        break;
    }
  };

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

  const generatePreview = async () => {
    if (!selectedResource) {
      message.warning('Please select a resource first');
      return;
    }

    setPreviewLoading(true);
    try {
      // Use first school for preview
      const previewSchool = schools[0];
      if (!previewSchool) {
        message.warning('No schools available for preview');
        return;
      }

      const response = await axios.post(
        `${API}/admin/generate-watermark-preview`,
        {
          resource_id: selectedResource.resource_id,
          school_ids: [previewSchool.school_id],
          positions: watermarkPositions
        },
        { responseType: 'blob' }
      );

      // Check if response is PDF or image
      const contentType = response.headers['content-type'];
      const imageUrl = URL.createObjectURL(response.data);
      setPreviewImage(imageUrl);
      
      message.success('Preview generated successfully');
    } catch (error) {
      console.error('Error generating preview:', error);
      message.error(error.response?.data?.detail || 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const saveWatermarkTemplate = async () => {
    if (!selectedResource) {
      message.warning('Please select a resource first');
      return;
    }

    try {
      const response = await axios.post(`${API}/admin/save-watermark-template`, {
        admin_id: 'admin', // In real app, get from user context
        resource_id: selectedResource.resource_id,
        positions: watermarkPositions,
        is_for_all: selectAll
      });

      if (response.data.status === 'success') {
        message.success(response.data.message);
      } else {
        message.error('Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      message.error(error.response?.data?.detail || 'Failed to save template');
    }
  };

  const downloadWatermarkedResources = async () => {
    if (!selectedResource) {
      message.warning('Please select a resource first');
      return;
    }

    if (selectedSchools.length === 0 && !selectAll) {
      message.warning('Please select at least one school');
      return;
    }

    const schoolsToProcess = selectAll ? schools : schools.filter(s => selectedSchools.includes(s.school_id));
    setTotalToDownload(schoolsToProcess.length);
    setBatchDownloading(true);
    setDownloadProgress(0);

    try {
      // Create a ZIP file with all watermarked resources
      const response = await axios.post(
        `${API}/admin/download-batch-watermarked`,
        {
          resource_id: selectedResource.resource_id,
          school_ids: selectAll ? 'all' : selectedSchools,
          positions: watermarkPositions
        },
        { responseType: 'blob' }
      );

      // Create download link
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedResource.name}_watermarked_schools.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      message.success(`Downloaded ${schoolsToProcess.length} watermarked resources`);
    } catch (error) {
      console.error('Error downloading batch:', error);
      message.error('Failed to download watermarked resources');
    } finally {
      setBatchDownloading(false);
      setDownloadProgress(0);
    }
  };

  const downloadIndividualFiles = async () => {
    if (!selectedResource) {
      message.warning('Please select a resource first');
      return;
    }

    if (selectedSchools.length === 0 && !selectAll) {
      message.warning('Please select at least one school');
      return;
    }

    const schoolsToProcess = selectAll ? schools : schools.filter(s => selectedSchools.includes(s.school_id));
    setTotalToDownload(schoolsToProcess.length);
    setDownloadProgress(0);

    // Download each file individually
    for (let i = 0; i < schoolsToProcess.length; i++) {
      try {
        const school = schoolsToProcess[i];
        const response = await axios.post(
          `${API}/admin/download-watermarked-resource`,
          {
            resource_id: selectedResource.resource_id,
            school_id: school.school_id,
            positions: watermarkPositions
          },
          { responseType: 'blob' }
        );

        // Download individual file
        const blob = new Blob([response.data], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedResource.name}_${school.school_name.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        setDownloadProgress(i + 1);
      } catch (error) {
        console.error(`Error downloading for school ${schoolsToProcess[i].school_name}:`, error);
        message.error(`Failed to download for ${schoolsToProcess[i].school_name}`);
      }
    }

    message.success(`Downloaded ${schoolsToProcess.length} files`);
    setDownloadProgress(0);
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const columns = [
    {
      title: 'Resource',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.category}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'file_type',
      key: 'file_type',
      render: (type) => <Tag color="blue">{type?.split('/').pop() || 'File'}</Tag>,
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
    },
    {
      title: 'Uploaded',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => setSelectedResource(record)}
        >
          Select
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Batch Watermark Resources for Schools"
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
        <Tabs defaultActiveKey="1">
          <TabPane tab="Select Resource" key="1">
            <Table
              columns={columns}
              dataSource={filteredResources}
              rowKey="resource_id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              onRow={(record) => ({
                onClick: () => setSelectedResource(record),
                style: {
                  cursor: 'pointer',
                  backgroundColor: selectedResource?.resource_id === record.resource_id ? '#f0f9ff' : 'transparent'
                }
              })}
            />
          </TabPane>

          <TabPane tab="Select Schools" key="2" disabled={!selectedResource}>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <Checkbox
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                >
                  <strong>Select All Schools ({schools.length} schools)</strong>
                </Checkbox>
              </div>

              <Divider />

              <Row gutter={[16, 16]}>
                {schools.map(school => (
                  <Col xs={24} sm={12} md={8} lg={6} key={school.school_id}>
                    <Card
                      size="small"
                      style={{
                        border: selectedSchools.includes(school.school_id) ? '2px solid #1890ff' : '1px solid #f0f0f0',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        if (!selectAll) {
                          const isSelected = selectedSchools.includes(school.school_id);
                          handleSchoolSelect(school.school_id, !isSelected);
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Checkbox
                          checked={selectAll || selectedSchools.includes(school.school_id)}
                          disabled={selectAll}
                          onChange={(e) => handleSchoolSelect(school.school_id, e.target.checked)}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold' }}>{school.school_name}</div>
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
            </div>
          </TabPane>

          <TabPane tab="Customize Watermark" key="3" disabled={!selectedResource}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 2 }}>
                <div
                  id="preview-container"
                  style={{
                    width: '100%',
                    height: '500px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '8px',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseUp={() => setIsDragging(null)}
                  onMouseLeave={() => setIsDragging(null)}
                  onMouseMove={(e) => handleDrag(e, activeElement)}
                >
                  {previewLoading ? (
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
                  ) : previewImage ? (
                    <img
                      src={previewImage}
                      alt="Watermark Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#999' }}>
                      <FilePdfOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                      <p>Click "Generate Preview" to see watermark</p>
                    </div>
                  )}

                  {/* Logo Preview */}
                  {isEditing && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${watermarkPositions.logo_x}%`,
                        top: `${watermarkPositions.logo_y}%`,
                        width: `${watermarkPositions.logo_width * 5}px`,
                        height: `${watermarkPositions.logo_width * 2.5}px`,
                        backgroundColor: 'rgba(24, 144, 255, 0.3)',
                        border: activeElement === 'logo' ? '2px dashed #1890ff' : '1px dashed #ccc',
                        borderRadius: '4px',
                        transform: 'translate(-50%, -50%)',
                        cursor: isDragging === 'logo' ? 'grabbing' : 'grab',
                        pointerEvents: 'auto',
                        opacity: watermarkPositions.logo_opacity,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1890ff',
                        fontWeight: 'bold'
                      }}
                      onMouseDown={() => {
                        setActiveElement('logo');
                        setIsDragging('logo');
                      }}
                    >
                      LOGO
                    </div>
                  )}

                  {/* School Name Preview */}
                  {isEditing && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${watermarkPositions.school_name_x}%`,
                        top: `${watermarkPositions.school_name_y}%`,
                        fontSize: `${watermarkPositions.school_name_size}px`,
                        color: '#000',
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        transform: 'translate(-50%, -50%)',
                        cursor: isDragging === 'schoolName' ? 'grabbing' : 'grab',
                        pointerEvents: 'auto',
                        opacity: watermarkPositions.school_name_opacity,
                        border: activeElement === 'schoolName' ? '2px dashed #52c41a' : '1px dashed #ccc',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseDown={() => {
                        setActiveElement('schoolName');
                        setIsDragging('schoolName');
                      }}
                    >
                      School Name
                    </div>
                  )}

                  {/* Contact Info Preview */}
                  {isEditing && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${watermarkPositions.contact_x}%`,
                        top: `${watermarkPositions.contact_y}%`,
                        fontSize: `${watermarkPositions.contact_size}px`,
                        color: '#000',
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        transform: 'translate(-50%, -50%)',
                        cursor: isDragging === 'contact' ? 'grabbing' : 'grab',
                        pointerEvents: 'auto',
                        opacity: watermarkPositions.contact_opacity,
                        border: activeElement === 'contact' ? '2px dashed #fa8c16' : '1px dashed #ccc',
                        textAlign: 'center'
                      }}
                      onMouseDown={() => {
                        setActiveElement('contact');
                        setIsDragging('contact');
                      }}
                    >
                      <div>email@school.com</div>
                      <div>📞 +91 1234567890</div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={generatePreview}
                    disabled={!selectedResource}
                  >
                    Generate Preview
                  </Button>
                  <Button
                    icon={isEditing ? <CheckSquareOutlined /> : <SettingOutlined />}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'Done Editing' : 'Edit Positions'}
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={saveWatermarkTemplate}
                  >
                    Save Template
                  </Button>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <Card title="Position Controls" size="small">
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Active Element:</div>
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
                        Contact
                      </Button>
                    </Space>
                  </div>

                  {activeElement === 'logo' && (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ marginBottom: '8px' }}>Logo Size: {watermarkPositions.logo_width}%</div>
                        <Slider
                          min={5}
                          max={50}
                          value={watermarkPositions.logo_width}
                          onChange={(value) => setWatermarkPositions(prev => ({ ...prev, logo_width: value }))}
                        />
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ marginBottom: '8px' }}>Logo Opacity: {(watermarkPositions.logo_opacity * 100).toFixed(0)}%</div>
                        <Slider
                          min={10}
                          max={100}
                          value={watermarkPositions.logo_opacity * 100}
                          onChange={(value) => setWatermarkPositions(prev => ({ ...prev, logo_opacity: value / 100 }))}
                        />
                      </div>
                    </>
                  )}

                  {activeElement === 'schoolName' && (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ marginBottom: '8px' }}>Font Size: {watermarkPositions.school_name_size}px</div>
                        <Slider
                          min={10}
                          max={30}
                          value={watermarkPositions.school_name_size}
                          onChange={(value) => setWatermarkPositions(prev => ({ ...prev, school_name_size: value }))}
                        />
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ marginBottom: '8px' }}>Opacity: {(watermarkPositions.school_name_opacity * 100).toFixed(0)}%</div>
                        <Slider
                          min={10}
                          max={100}
                          value={watermarkPositions.school_name_opacity * 100}
                          onChange={(value) => setWatermarkPositions(prev => ({ ...prev, school_name_opacity: value / 100 }))}
                        />
                      </div>
                    </>
                  )}

                  {activeElement === 'contact' && (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ marginBottom: '8px' }}>Font Size: {watermarkPositions.contact_size}px</div>
                        <Slider
                          min={8}
                          max={20}
                          value={watermarkPositions.contact_size}
                          onChange={(value) => setWatermarkPositions(prev => ({ ...prev, contact_size: value }))}
                        />
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ marginBottom: '8px' }}>Opacity: {(watermarkPositions.contact_opacity * 100).toFixed(0)}%</div>
                        <Slider
                          min={10}
                          max={100}
                          value={watermarkPositions.contact_opacity * 100}
                          onChange={(value) => setWatermarkPositions(prev => ({ ...prev, contact_opacity: value / 100 }))}
                        />
                      </div>
                    </>
                  )}
                </Card>
              </div>
            </div>
          </TabPane>
        </Tabs>

        {selectedResource && (
          <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0 }}>Selected Resource: {selectedResource.name}</h4>
                <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                  Selected Schools: {selectAll ? 'All Schools' : `${selectedSchools.length} schools`}
                </p>
              </div>
              
              <Space>
                {batchDownloading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Spin size="small" />
                    <span>Downloading {downloadProgress}/{totalToDownload}</span>
                  </div>
                )}
                
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={downloadWatermarkedResources}
                  disabled={batchDownloading}
                  loading={batchDownloading}
                >
                  Download as ZIP
                </Button>
                
                <Button
                  onClick={downloadIndividualFiles}
                  disabled={batchDownloading}
                >
                  Download Individual Files
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminResourceWatermark;