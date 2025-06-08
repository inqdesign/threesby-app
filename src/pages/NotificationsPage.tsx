import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Heart, MessageSquare, User, Clock } from 'lucide-react';

type Notification = {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'system';
  content: string;
  created_at: string;
  is_read: boolean;
  sender?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  pick?: {
    id: string;
    title: string;
    image_url: string;
  };
};

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // This is a placeholder function - in a real implementation, you would fetch actual notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    
    // For now, we'll create mock notifications
    // In a real implementation, you would fetch from a notifications table
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'like',
        content: 'liked your pick',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        is_read: false,
        sender: {
          id: 'user1',
          full_name: 'Jane Smith',
          avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        },
        pick: {
          id: 'pick1',
          title: 'The Great Gatsby',
          image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
        },
      },
      {
        id: '2',
        type: 'follow',
        content: 'started following you',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        is_read: true,
        sender: {
          id: 'user2',
          full_name: 'John Doe',
          avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        },
      },
      {
        id: '3',
        type: 'comment',
        content: 'commented on your pick',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        is_read: true,
        sender: {
          id: 'user3',
          full_name: 'Alex Johnson',
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        },
        pick: {
          id: 'pick2',
          title: 'Paris, France',
          image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
        },
      },
      {
        id: '4',
        type: 'system',
        content: 'Your profile has been approved!',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        is_read: true,
      },
    ];
    
    setNotifications(mockNotifications);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return `${diffDay}d ago`;
    } else if (diffHour > 0) {
      return `${diffHour}h ago`;
    } else if (diffMin > 0) {
      return `${diffMin}m ago`;
    } else {
      return 'Just now';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-pink-500" />;
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <User className="w-5 h-5 text-green-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#252525]">Activity</h1>
        {notifications.some(n => !n.is_read) && (
          <button 
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={() => {
              // Mark all as read functionality would go here
              setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            }}
          >
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">You don't have any notifications yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <li 
                key={notification.id} 
                className={`p-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {notification.sender ? (
                      <img 
                        src={notification.sender.avatar_url} 
                        alt={notification.sender.full_name}
                        className="w-10 h-10 rounded-full object-cover" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {notification.sender && <span className="font-medium">{notification.sender.full_name}</span>}
                      {' '}
                      {notification.content}
                      {notification.pick && (
                        <span className="font-medium"> "{notification.pick.title}"</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                  {notification.pick && (
                    <div className="flex-shrink-0">
                      <img 
                        src={notification.pick.image_url} 
                        alt={notification.pick.title}
                        className="w-12 h-12 object-cover rounded" 
                      />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
