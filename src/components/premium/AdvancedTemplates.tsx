'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Crown, Download, Star, Eye, Users, Briefcase, GraduationCap } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'education' | 'personal' | 'technical';
  isPremium: boolean;
  downloadCount: number;
  rating: number;
  previewUrl?: string;
  thumbnailUrl?: string;
}

interface AdvancedTemplatesProps {
  userPlan: 'free' | 'pro' | 'proplus';
}

export default function AdvancedTemplates({ userPlan }: AdvancedTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const hasAdvancedAccess = userPlan === 'pro' || userPlan === 'proplus';

  const categories = [
    { id: 'all', name: 'All Templates', icon: FileText },
    { id: 'business', name: 'Business', icon: Briefcase },
    { id: 'education', name: 'Education', icon: GraduationCap },
    { id: 'personal', name: 'Personal', icon: Users },
  ];

  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/templates?category=${selectedCategory}`);
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates || []);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [selectedCategory]);

  const downloadTemplate = async (templateId: string) => {
    if (!hasAdvancedAccess) {
      window.location.href = '/pricing';
      return;
    }

    try {
      const response = await fetch(`/api/templates/${templateId}/download`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `template-${templateId}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  const previewTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/preview`);
      if (response.ok) {
        const data = await response.json();
        // Open preview in a modal or new window
        window.open(data.previewUrl, '_blank');
      }
    } catch (error) {
      console.error('Error previewing template:', error);
    }
  };

  if (!hasAdvancedAccess) {
    return (
      <div className="bg-[#2A2A2A] rounded-2xl p-6 border border-[#323232]">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-6 h-6 text-gray-400" />
          <h3 className="text-white text-xl font-semibold">Advanced Templates</h3>
          <Crown className="w-5 h-5 text-primary" />
        </div>
        <p className="text-gray-400 mb-4">
          Access professional templates for business, education, and personal use. Available with Pro and Pro+ plans.
        </p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#1E1E1E] rounded-xl p-4 border border-[#323232] opacity-50">
            <div className="w-full h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mb-3"></div>
            <p className="text-white font-semibold text-sm">Business Report</p>
            <p className="text-gray-400 text-xs">Professional template</p>
          </div>
          <div className="bg-[#1E1E1E] rounded-xl p-4 border border-[#323232] opacity-50">
            <div className="w-full h-32 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-lg mb-3"></div>
            <p className="text-white font-semibold text-sm">Course Material</p>
            <p className="text-gray-400 text-xs">Education template</p>
          </div>
        </div>
        <button
          onClick={() => window.location.href = '/pricing'}
          className="bg-primary hover:bg-primary/80 text-black px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          Upgrade to Access Templates
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#2A2A2A] rounded-2xl p-6 border border-[#323232]">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-primary" />
        <h3 className="text-white text-xl font-semibold">Advanced Templates</h3>
        {userPlan === 'proplus' && <Crown className="w-5 h-5 text-primary" />}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary text-black'
                  : 'bg-[#1E1E1E] text-gray-400 hover:text-white border border-[#323232]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {category.name}
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#1E1E1E] rounded-xl p-4 border border-[#323232] animate-pulse">
              <div className="w-full h-32 bg-[#2A2A2A] rounded-lg mb-3"></div>
              <div className="h-4 bg-[#2A2A2A] rounded mb-2"></div>
              <div className="h-3 bg-[#2A2A2A] rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.02 }}
              className="bg-[#1E1E1E] rounded-xl p-4 border border-[#323232] group cursor-pointer"
            >
              <div className="relative mb-3">
                <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-cyan-500/10 rounded-lg overflow-hidden">
                  {template.thumbnailUrl ? (
                    <img
                      src={template.thumbnailUrl}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                  )}
                </div>
                {template.isPremium && (
                  <div className="absolute top-2 right-2 bg-primary text-black px-2 py-1 rounded-lg text-xs font-semibold">
                    Premium
                  </div>
                )}
              </div>

              <h4 className="text-white font-semibold mb-1">{template.name}</h4>
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">{template.description}</p>

              <div className="flex items-center gap-4 mb-3 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {template.downloadCount}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {template.rating.toFixed(1)}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => previewTemplate(template.id)}
                  className="flex-1 bg-[#2A2A2A] hover:bg-[#323232] text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={() => downloadTemplate(template.id)}
                  className="flex-1 bg-primary hover:bg-primary/80 text-black px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && templates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">No templates found in this category.</p>
        </div>
      )}
    </div>
  );
}
