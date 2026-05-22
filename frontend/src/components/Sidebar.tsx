import React, { useState } from 'react';
import { DocumentTextIcon, BookOpenIcon, Cog6ToothIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import logo from '../assets/img/logo.png';

interface SidebarProps {
  currentMenu: 'proposal' | 'knowledge';
  onMenuChange: (menu: 'proposal' | 'knowledge') => void;
  onSettingsClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentMenu, onMenuChange, onSettingsClick }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'proposal' as const, label: '标书制作', icon: DocumentTextIcon },
    { id: 'knowledge' as const, label: '知识库', icon: BookOpenIcon },
  ];

  return (
    <div className={`flex flex-col bg-white shadow-sm border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-48'
    }`}>
      <div className="flex-1 p-4">
        <div className={`mb-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="h-6 w-6 rounded-lg object-contain" />
              <h1 className="text-lg font-bold text-gray-900">AI标书助手</h1>
            </div>
          )}
           {/* 折叠/展开按钮 */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            title={isCollapsed ? '展开菜单' : '折叠菜单'}
          >
            {isCollapsed ? (
              <ChevronDoubleRightIcon className="w-5 h-5" />
            ) : (
              <ChevronDoubleLeftIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onMenuChange(item.id)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                currentMenu === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              {!isCollapsed && item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 折叠按钮和设置按钮 */}
      <div className="border-t border-gray-200 p-2">
       

        {/* 设置按钮 */}
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            title={isCollapsed ? '模型设置' : undefined}
          >
            <Cog6ToothIcon className="w-5 h-5 flex-shrink-0 mr-2" />
            {!isCollapsed && '模型设置'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;