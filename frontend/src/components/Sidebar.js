import React from 'react';
import { Layout, Menu, theme } from 'antd';
import { 
  DashboardOutlined, 
  BankOutlined, 
  FileOutlined,
  LogoutOutlined,
  BookOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FileWordOutlined,
  FilePptOutlined,
  VideoCameraOutlined,
  BarChartOutlined,
  MessageOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  UserOutlined,
  DownOutlined,
  LineChartOutlined,
  NotificationOutlined,
  CommentOutlined,
  FileSearchOutlined,
  FileDoneOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  CloudUploadOutlined
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';

const { Sider } = Layout;

const Sidebar = ({ collapsed, onCollapse }) => {
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/admin">Dashboard Home</Link>,
    },
    {
      key: 'schools',
      icon: <BankOutlined />,
      label: <Link to="/admin/schools">School Management</Link>,
    },
    {
      key: 'resources',
      icon: <FileOutlined />,
      label: 'Resource Management',
      children: [
        {
          key: 'all_resources',
          icon: <FileTextOutlined />,
          label: <Link to="/admin/resources">All Resources</Link>,
        },
        {
          key: 'academic',
          icon: <BookOutlined />,
          label: <Link to="/admin/resources/academic">Academic Resources</Link>,
        },
        {
          key: 'marketing',
          icon: <FileImageOutlined />,
          label: <Link to="/admin/resources/marketing">Marketing Resources</Link>,
        },
        {
          key: 'administrative',
          icon: <FileTextOutlined />,
          label: <Link to="/admin/resources/administrative">Administrative</Link>,
        },
        {
          key: 'training',
          icon: <FileWordOutlined />,
          label: <Link to="/admin/resources/training">Training Resources</Link>,
        },
        {
          key: 'event',
          icon: <FilePptOutlined />,
          label: <Link to="/admin/resources/event">Event & Celebration</Link>,
        },
        {
          key: 'multimedia',
          icon: <VideoCameraOutlined />,
          label: <Link to="/admin/resources/multimedia">Multimedia Collection</Link>,
        }
      ],
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics & Tracking',
      children: [
        {
          key: 'school_activity',
          icon: <LineChartOutlined />,
          label: <Link to="/admin/analytics/school-activity">School Activity</Link>,
        },
        {
          key: 'resource_analytics',
          icon: <FileSearchOutlined />,
          label: <Link to="/admin/analytics/resource-analytics">Resource Analytics</Link>,
        },
        {
          key: 'search_analytics',
          icon: <FileSearchOutlined />,
          label: <Link to="/admin/analytics/search-analytics">Search Analytics</Link>,
        },
        {
          key: 'download_tracking',
          icon: <CloudUploadOutlined />,
          label: <Link to="/admin/analytics/download-tracking">Download Tracking</Link>,
        },
      ],
    },
    {
      key: 'communication',
      icon: <MessageOutlined />,
      label: 'Communication Center',
      children: [
        {
          key: 'announcements',
          icon: <NotificationOutlined />,
          label: <Link to="/admin/communication/announcements">Announcements</Link>,
        },
        {
          key: 'chat',
          icon: <CommentOutlined />,
          label: <Link to="/admin/communication/chat">Chat with Schools</Link>,
        },
      ],
    },
    {
      key: 'support',
      icon: <QuestionCircleOutlined />,
      label: 'Support & Feedback',
      children: [
        {
          key: 'tickets',
          icon: <FileDoneOutlined />,
          label: <Link to="/admin/support/tickets">Support Tickets</Link>,
        },
        {
          key: 'knowledge_base',
          icon: <FileTextOutlined />,
          label: <Link to="/admin/support/knowledge-base">Knowledge Base</Link>,
        },
      ],
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      children: [
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: <Link to="/admin/settings/profile">Admin Profile</Link>,
        },
        {
          key: 'branding',
          icon: <FileImageOutlined />,
          label: <Link to="/admin/settings/branding">Branding</Link>,
        },
        {
          key: 'cms',
          icon: <FileTextOutlined />,
          label: <Link to="/admin/settings/cms">Content Management</Link>,
        },
        {
          key: 'admins',
          icon: <TeamOutlined />,
          label: <Link to="/admin/settings/admins">Admin Users</Link>,
        },
        {
          key: 'security',
          icon: <SafetyCertificateOutlined />,
          label: <Link to="/admin/settings/security">Security</Link>,
        },
        {
          key: 'backup',
          icon: <CloudUploadOutlined />,
          label: <Link to="/admin/settings/backup">Data Backup</Link>,
        },
      ],
    },
  ];

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('schools')) return ['schools'];
    if (path.includes('resources')) return ['resources'];
    if (path.includes('analytics')) return ['analytics'];
    if (path.includes('communication')) return ['communication'];
    if (path.includes('support')) return ['support'];
    if (path.includes('settings')) return ['settings'];
    return ['dashboard'];
  };

  const getOpenKeys = () => {
    const path = location.pathname;
    const openKeys = [];
    
    if (path.includes('resources')) openKeys.push('resources');
    if (path.includes('analytics')) openKeys.push('analytics');
    if (path.includes('communication')) openKeys.push('communication');
    if (path.includes('support')) openKeys.push('support');
    if (path.includes('settings')) openKeys.push('settings');
    
    return openKeys;
  };

  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={onCollapse}
      width={250}
      style={{
        background: colorBgContainer,
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        boxShadow: '2px 0 8px 0 rgba(29, 35, 41, 0.05)',
      }}
    >
      <div className="logo">
        <h2>{collapsed ? 'WL' : 'Wonder Learning'}</h2>
      </div>
      <Menu
        theme="light"
        mode="inline"
        defaultSelectedKeys={getSelectedKey()}
        defaultOpenKeys={getOpenKeys()}
        selectedKeys={getSelectedKey()}
        items={menuItems}
        style={{ borderRight: 0 }}
      />
      <div className="logout-container">
        <Menu
          theme="light"
          mode="inline"
          className="logout-menu"
        >
          <Menu.Item 
            key="logout" 
            icon={<LogoutOutlined />}
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/';
            }}
          >
            Logout
          </Menu.Item>
        </Menu>
      </div>
    </Sider>
  );
};

export default Sidebar;
