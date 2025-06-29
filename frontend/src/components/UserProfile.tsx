import React, { useState } from 'react'
import { User, LogOut, Settings, Heart, MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { mockUser } from '../types/user'
import { cn } from '../lib'

interface UserProfileProps {
  isOpen: boolean
  onClose: () => void
  onSignOut: () => void
}

export function UserProfile({ isOpen, onClose, onSignOut }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile')
  const user = mockUser

  const handleSignOut = () => {
    onSignOut()
    onClose()
  }

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full border-4 border-white/20"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-primary-100">{user.email}</p>
              <div className="flex items-center space-x-1 mt-1 text-primary-200">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Member since {new Date(user.joinedDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={cn(
                'flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              )}
            >
              <User className="h-4 w-4 inline mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={cn(
                'flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'preferences'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              )}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              Preferences
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 bg-white dark:bg-gray-800">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Profile Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={user.name}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Your Activity
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600">23</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Searches</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600">8</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Favorites</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600">15</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Reviews</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Heart className="h-5 w-5 text-red-500" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Added The Test Kitchen to favorites
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary-500" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Searched for "romantic dinner with ocean views"
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">1 day ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              {/* Favorite Categories */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Favorite Cuisines
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.preferences?.favoriteCategories.map((category) => (
                    <span
                      key={category}
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Preferred Price Range
                </h3>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-900 dark:text-white font-medium">
                    {user.preferences?.priceRange}
                  </span>
                </div>
              </div>

              {/* Dietary Restrictions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Dietary Restrictions
                </h3>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">
                    {user.preferences?.dietaryRestrictions.length === 0 
                      ? 'No dietary restrictions' 
                      : user.preferences?.dietaryRestrictions.join(', ')
                    }
                  </span>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Notifications
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Email notifications</span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">New restaurant alerts</span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Weekly recommendations</span>
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 bg-gray-50 dark:bg-gray-700 rounded-b-xl border-t border-gray-200 dark:border-gray-600">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </Modal>
  )
}