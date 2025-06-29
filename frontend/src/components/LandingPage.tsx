import React from 'react'
import { ChefHat, Search, MessageCircle, Star, MapPin, Users, ArrowRight, Sparkles, Sun, Moon } from 'lucide-react'
import { Button } from './ui/Button'
import { useTheme } from '../contexts/ThemeContext'

interface LandingPageProps {
  onSignIn: () => void
}

export function LandingPage({ onSignIn }: LandingPageProps) {
  const { theme, toggleTheme } = useTheme()

  const handleChatAssistantClick = () => {
    // Sign in and navigate to chat
    onSignIn()
    // The app will handle setting the active tab to 'chat' via session storage
    sessionStorage.setItem('chowgpt_active_tab', JSON.stringify('chat'))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-600 rounded-xl shadow-lg">
              <ChefHat className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                ChowGPT
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI Restaurant Finder
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle dark mode"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </Button>
            
            <Button variant="ghost" onClick={onSignIn}>
              Sign In
            </Button>
            <Button variant="primary" onClick={onSignIn} className="shadow-lg">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-4 py-2 rounded-full text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  <span>AI-Powered Restaurant Discovery</span>
                </div>
                
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                  Find Your Perfect
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
                    {" "}Restaurant in Cape&nbsp;Town
                  </span>
                </h1>
                
                <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                  Discover amazing restaurants in Cape Town with our AI-powered search. 
                  Just describe what you're craving, and we'll find the perfect match for you.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={onSignIn}
                  className="shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200"
                >
                  Start Exploring
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={handleChatAssistantClick}
                  className="border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Try Chat Assistant
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">500+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Restaurants</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">50K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">95%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Match Rate</div>
                </div>
              </div>
            </div>

            {/* Right Column - Hero Image */}
            <div className="relative">
              <div className="relative z-10">
                <img
                  src="https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg"
                  alt="Beautiful restaurant dining experience in Cape Town"
                  className="w-full h-[600px] object-cover rounded-2xl shadow-2xl"
                />
                
                {/* Floating Cards */}
                <div className="absolute -top-4 -left-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 animate-float">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                      <Search className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">AI Search</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Smart matching</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 animate-bounce-gentle">
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="font-semibold text-gray-900 dark:text-white">4.8</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Perfect Match!</span>
                  </div>
                </div>
              </div>

              {/* Background Decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-200 to-secondary-200 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-2xl transform rotate-3 scale-105 -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose ChowGPT?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Our AI-powered platform makes finding the perfect restaurant in Cape Town effortless and personalized.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center group">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <Search className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Smart AI Search
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Describe your perfect dining experience in natural language and let our AI find the ideal match in Cape Town.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center group">
              <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <MessageCircle className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Chat Assistant
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get personalized recommendations and answers to all your dining questions from our AI assistant.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center group">
              <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <MapPin className="h-8 w-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Cape Town Expertise
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Discover hidden gems and popular spots across Cape Town with detailed local insights and recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Discover Your Next Favorite Restaurant in Cape Town?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of food lovers who trust ChowGPT to find their perfect dining experiences in the Mother City.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="lg" 
              onClick={onSignIn}
              className="bg-white text-primary-600 hover:bg-gray-50 shadow-xl"
            >
              <Users className="mr-2 h-5 w-5" />
              Get Started Now
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleChatAssistantClick}
              className="border-white text-white hover:bg-white/10"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Try Chat Assistant
            </Button>
          </div>
          
          <p className="text-primary-200 text-sm mt-6">
            Free to use • No credit card required • Instant access
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-900 dark:bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="p-2 bg-primary-600 rounded-lg">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">ChowGPT</div>
                <div className="text-sm text-gray-400">AI Restaurant Finder for Cape Town</div>
              </div>
            </div>
            
            <div className="text-gray-400 text-sm">
              © 2024 ChowGPT. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}