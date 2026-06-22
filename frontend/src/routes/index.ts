/**
 * 路由配置
 */
import React from 'react';

export type RouteName = 'login' | 'proposal' | 'proposal-detail' | 'knowledge';

export interface RouteConfig {
  name: RouteName;
  path: string;
  element: React.ReactNode;
}
