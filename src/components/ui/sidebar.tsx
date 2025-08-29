"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Building2, 
  Calendar, 
  FileText, 
  User,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Edit3,
  Menu,
  X
} from "lucide-react"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    {
      title: "Gestión",
      items: [
        {
          id: "management",
          label: "Sucursales y Empleados",
          icon: Users,
        },
      ]
    },
    {
      title: "Generador",
      items: [
        {
          id: "generator",
          label: "Crear Horarios",
          icon: Calendar,
        },
      ]
    },
    {
      title: "Visualizador",
      items: [
        {
          id: "schedules",
          label: "Ver Horarios", 
          icon: FileText,
        },
        {
          id: "editor",
          label: "Editar Horarios",
          icon: Edit3,
        },
      ]
    },
    {
      title: "Estadísticas",
      items: [
        {
          id: "stats",
          label: "Métricas y Reportes",
          icon: BarChart3,
        },
      ]
    }
  ]

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-gray-900 text-white hover:bg-gray-800 shadow-lg"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex flex-col bg-gray-900 text-white transition-all duration-300 fixed left-0 top-0 h-full z-30",
        isCollapsed ? "w-16" : "w-64"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-white">Gestión RH</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="cursor-pointer hover:bg-gray-800 text-white"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6">
          {navigationItems.map((section) => (
            <div key={section.title}>
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start cursor-pointer transition-colors",
                        activeTab === item.id 
                          ? "bg-purple-600 text-white border-purple-600" 
                          : "hover:bg-gray-800 text-gray-300"
                      )}
                      onClick={() => onTabChange(item.id)}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {!isCollapsed && item.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          {!isCollapsed && (
            <p className="text-xs text-gray-400 text-center">
              Sistema de Gestión v1.0.0
            </p>
          )}
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={cn(
        "lg:hidden fixed left-0 top-0 h-full bg-gray-900 text-white z-50 transition-transform duration-300",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        "w-72"
      )}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Gestión RH</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(false)}
            className="cursor-pointer hover:bg-gray-800 text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {navigationItems.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start cursor-pointer transition-colors h-12 text-base",
                        activeTab === item.id 
                          ? "bg-purple-600 text-white border-purple-600" 
                          : "hover:bg-gray-800 text-gray-300"
                      )}
                      onClick={() => {
                        onTabChange(item.id)
                        setIsMobileMenuOpen(false)
                      }}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {item.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Mobile Footer */}
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center">
            Sistema de Gestión v1.0.0
          </p>
        </div>
      </div>
    </>
  )
}
