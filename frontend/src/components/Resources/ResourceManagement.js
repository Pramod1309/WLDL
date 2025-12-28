import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';

const { Content } = Layout;

const ResourceManagement = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Content
        style={{
          padding: 0,
          margin: 0,
          minHeight: 'calc(100vh - 112px)',
          background: 'transparent',
        }}
      >
        <Outlet />
      </Content>
    </div>
  );
};

export default ResourceManagement;
