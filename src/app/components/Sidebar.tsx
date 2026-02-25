import { 
  LayoutDashboard, 
  Clock, 
  FileText, 
  Users, 
  Archive,
  Edit3,
  Calendar,
  Coffee,
  List,
  FileEdit,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
} 

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  children?: MenuItem[];
}

export function Sidebar({ activePage, onPageChange, isOpen, onClose }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['dashboard', 'user-management', 'time-management']);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'DASHBOARD',
      icon: LayoutDashboard,
      children: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'time-records', label: 'Time Records', icon: Clock },
        { id: 'activity-logs', label: 'Activity Logs', icon: FileText },
      ],
    },
    { 
      id: 'user-management', 
      label: 'User Management', 
      icon: Users,
      children: [
        { id: 'users', label: 'Users', icon: Users },
        { id: 'archived-users', label: 'Archived Users', icon: Archive },
      ]
    },
    { 
      id: 'time-management', 
      label: 'Time Management', 
      icon: Calendar,
      children: [
        { id: 'schedules', label: 'Schedules', icon: Calendar },
        { id: 'breaklist-summary', label: 'Breaklist Summary', icon: Coffee },
        { id: 'edit-breaklist', label: 'Edit Breaklist', icon: FileEdit },
        { id: 'generated-breaklist', label: 'Generated Breaklist', icon: List },
        { id: 'time-adjustment', label: 'Time Adjustment', icon: Edit3 },
      ]
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.id);
    const isActive = activePage === item.id;

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleSection(item.id)}
            className="w-full flex items-center justify-between px-6 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </div>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {isExpanded && (
            <div className="bg-gray-900/50">
              {item.children?.map(child => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.id}
        onClick={() => onPageChange(item.id)}
        className={`
          w-full flex items-center gap-3 py-3 text-sm transition-colors
          ${level > 0 ? 'pl-12 pr-6' : 'px-6'}
          ${isActive 
            ? 'bg-[#1F4FD8] text-white border-l-4 border-white' 
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }
        `}
      >
        <Icon className="w-5 h-5" />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <aside
      className={`w-64 h-screen fixed left-0 top-0 z-40 flex flex-col overflow-y-auto bg-[#1a1f36] transform transition-transform duration-200 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}
    >
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1F4FD8] rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-lg leading-tight text-white">Sparkle Timekeeping Admin Dashboard</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 py-6">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>
      
      <div className="p-6 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-600">
            <span className="text-white text-xs font-semibold">AD</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="md:hidden m-4 mt-0 py-2 px-3 border border-gray-600 rounded-lg text-gray-200 hover:bg-gray-800"
        onClick={onClose}
      >
        Close Menu
      </button>
    </aside>
  );
}
