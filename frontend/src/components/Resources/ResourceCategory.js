import React, { useState } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Input, 
  Select, 
  Tag, 
  Typography, 
  Upload, 
  Modal, 
  Form, 
  Row, 
  Col,
  Tabs,
  Badge,
  Tooltip,
  message
} from 'antd';
import { 
  UploadOutlined, 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  DownloadOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileWordOutlined,
  FilePptOutlined,
  FileZipOutlined,
  FileUnknownOutlined,
  FileExcelOutlined,
  VideoCameraOutlined,
  AudioOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const ResourceCategory = ({ 
  title, 
  description, 
  resourceType,
  subcategories = [],
  columns = []
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewType, setPreviewType] = useState('');
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  // Mock data - in a real app, this would come from an API
  const [resources, setResources] = useState([
    // This would be populated with actual data
  ]);

  const classes = ['All Classes', 'PG', 'Nursery', 'JR KG', 'SR KG'];
  const tags = ['Worksheet', 'Activity', 'Festival', 'Math', 'Language', 'Science', 'Art'];

  const handleUpload = (file) => {
    // Handle file upload logic here
    console.log('Uploading file:', file);
    return false; // Prevent default upload
  };

  const handlePreview = async (file) => {
    try {
      setPreviewFile(file);
      setPreviewType(file.file_type || '');
      
      // For images and PDFs, we'll use the preview endpoint
      if (file.file_type?.includes('image/') || file.file_type?.includes('pdf')) {
        setPreviewVisible(true);
      } else {
        // For other file types, show a message that preview is not available
        // but still show the modal with a download option
        setPreviewVisible(true);
      }
    } catch (error) {
      console.error('Preview error:', error);
      message.error('Failed to preview file');
    }
  };

  const handleDownload = async (file) => {
    try {
      // Get the school info from localStorage if available
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const school_id = user.school_id || '';
      const school_name = user.school_name || '';
      
      // Construct the download URL with query parameters
      const url = new URL(`${process.env.REACT_APP_BACKEND_URL}/api/resources/${file.id}/download`);
      if (school_id && school_name) {
        url.searchParams.append('school_id', school_id);
        url.searchParams.append('school_name', school_name);
      }
      
      // Create a temporary link and trigger the download
      const link = document.createElement('a');
      link.href = url.toString();
      link.setAttribute('download', file.name || 'download');
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      message.success('Download started successfully');
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download file');
    }
  };

  const handleSubmit = (values) => {
    console.log('Form values:', values);
    // Handle form submission (API call)
    setIsModalVisible(false);
    form.resetFields();
  };

  const getFileIcon = (fileType) => {
    const type = fileType ? fileType.toLowerCase() : '';
    if (type.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
    if (type.includes('doc')) return <FileWordOutlined style={{ color: '#1890ff' }} />;
    if (type.includes('ppt')) return <FilePptOutlined style={{ color: '#ffa940' }} />;
    if (type.includes('xls')) return <FileExcelOutlined style={{ color: '#52c41a' }} />;
    if (type.includes('jpg') || type.includes('jpeg') || type.includes('png')) 
      return <FileImageOutlined style={{ color: '#722ed1' }} />;
    if (type.includes('mp4') || type.includes('mov')) 
      return <VideoCameraOutlined style={{ color: '#13c2c2' }} />;
    if (type.includes('mp3') || type.includes('wav')) 
      return <AudioOutlined style={{ color: '#eb2f96' }} />;
    if (type.includes('zip') || type.includes('rar')) 
      return <FileZipOutlined style={{ color: '#fa8c16' }} />;
    return <FileUnknownOutlined />;
  };

  const defaultColumns = [
    {
      title: 'Resource',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {getFileIcon(record.type)}
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Class',
      dataIndex: 'class',
      key: 'class',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags) => (
        <>
          {tags.map((tag) => (
            <Tag key={tag} color="geekblue">
              {tag}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Preview">
            <Button 
              type="link" 
              icon={<EyeOutlined />} 
              onClick={() => handlePreview(record)} 
            />
          </Tooltip>
          <Tooltip title="Download">
            <Button 
              type="link" 
              icon={<DownloadOutlined />} 
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="link" icon={<EditOutlined />} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesClass = selectedClass === 'all' || resource.class === selectedClass;
    const matchesTag = selectedTag === 'all' || resource.tags.includes(selectedTag);
    const matchesTab = activeTab === 'all' || resource.subcategory === activeTab;
    
    return matchesSearch && matchesClass && matchesTag && matchesTab;
  });

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3}>{title}</Title>
        <Text type="secondary">{description}</Text>
      </div>

      <Card 
        title={
          <Space size="large">
            <Input
              placeholder="Search resources..."
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Select
              defaultValue="all"
              style={{ width: 150 }}
              onChange={(value) => setSelectedClass(value)}
            >
              {classes.map(cls => (
                <Option key={cls} value={cls === 'All Classes' ? 'all' : cls}>
                  {cls}
                </Option>
              ))}
            </Select>
            <Select
              defaultValue="all"
              style={{ width: 150 }}
              onChange={(value) => setSelectedTag(value)}
            >
              <Option value="all">All Tags</Option>
              {tags.map(tag => (
                <Option key={tag} value={tag}>
                  {tag}
                </Option>
              ))}
            </Select>
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Add Resource
          </Button>
        }
      >
        {subcategories.length > 0 && (
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            style={{ marginBottom: 24 }}
          >
            <TabPane tab={
              <span>
                All {resourceType}s
                <Badge count={resources.length} style={{ marginLeft: 8 }} />
              </span>
            } key="all" />
            {subcategories.map(sub => (
              <TabPane 
                tab={
                  <span>
                    {sub.name}
                    <Badge count={resources.filter(r => r.subcategory === sub.key).length} style={{ marginLeft: 8 }} />
                  </span>
                } 
                key={sub.key} 
              />
            ))}
          </Tabs>
        )}

        <Table 
          columns={columns.length > 0 ? columns : defaultColumns} 
          dataSource={filteredResources}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={`Add New ${resourceType}`}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: 'Please enter a title' }]}
              >
                <Input placeholder="Enter resource title" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="class"
                label="Class"
                rules={[{ required: true, message: 'Please select a class' }]}
              >
                <Select placeholder="Select class">
                  {classes.filter(c => c !== 'All Classes').map(cls => (
                    <Option key={cls} value={cls}>{cls}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="description"
                label="Description"
                rules={[{ required: true, message: 'Please enter a description' }]}
              >
                <Input.TextArea rows={3} placeholder="Enter resource description" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="tags"
                label="Tags"
                rules={[{ required: true, message: 'Please select at least one tag' }]}
              >
                <Select 
                  mode="multiple" 
                  placeholder="Select tags"
                  options={tags.map(tag => ({ label: tag, value: tag }))}
                />
              </Form.Item>
            </Col>
          </Row>

          {subcategories.length > 0 && (
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="subcategory"
                  label={`${resourceType} Type`}
                  rules={[{ required: true, message: `Please select a ${resourceType.toLowerCase()} type` }]}
                >
                  <Select placeholder={`Select ${resourceType.toLowerCase()} type`}>
                    {subcategories.map(sub => (
                      <Option key={sub.key} value={sub.key}>{sub.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="file"
                label="Upload File"
                valuePropName="fileList"
                getValueFromEvent={(e) => e.fileList}
                rules={[{ required: true, message: 'Please upload a file' }]}
              >
                <Upload 
                  beforeUpload={handleUpload}
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />}>Click to upload</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="restrictDownload" label="Download Restrictions" valuePropName="checked">
                <Select placeholder="Select download option">
                  <Option value="no">No Restrictions</Option>
                  <Option value="yes">Restrict Download</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="accessLevel" label="Access Level" initialValue="all">
                <Select>
                  <Option value="all">Visible to All Schools</Option>
                  <Option value="specific">Specific Schools Only</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: 'right', marginTop: '24px' }}>
            <Button 
              style={{ marginRight: '8px' }}
              onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Upload Resource
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title="File Preview"
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="80%"
        style={{ top: 20 }}
      >
        <div style={{ textAlign: 'center', minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {previewFile && (
            <>
              {previewType.includes('image/') ? (
                <img 
                  src={`${process.env.REACT_APP_BACKEND_URL}/api/resources/${previewFile.id}/preview`} 
                  alt={previewFile.name} 
                  style={{ maxWidth: '100%', maxHeight: '70vh' }} 
                  onError={(e) => {
                    // Fallback to direct URL if preview fails
                    e.target.onerror = null;
                    e.target.src = `${process.env.REACT_APP_BACKEND_URL}/uploads/${previewFile.file_path}`;
                  }}
                />
              ) : previewType.includes('pdf') ? (
                <iframe
                  src={`${process.env.REACT_APP_BACKEND_URL}/api/resources/${previewFile.id}/preview#toolbar=0`}
                  title={previewFile.name}
                  style={{ width: '100%', height: '70vh', border: 'none' }}
                />
              ) : (
                <div>
                  <p>Preview not available for this file type.</p>
                  <Button 
                    type="primary" 
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(previewFile)}
                  >
                    Download File
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ResourceCategory;
