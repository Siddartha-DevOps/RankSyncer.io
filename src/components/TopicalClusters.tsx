import React from 'react';
import { 
  Folder, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  PlusCircle, 
  Plus, 
  TrendingUp,
  AlertCircle,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { Project, Article, Keyword } from '../types';

interface TopicalClustersProps {
  project: Project;
  projectKeywords: Keyword[];
  projectArticles: Article[];
  onSeedArticle: (title: string, targetKeyword: string) => void;
}

export default function TopicalClusters({ 
  project, 
  projectKeywords, 
  projectArticles, 
  onSeedArticle 
}: TopicalClustersProps) {

  // Define static parent thematic clusters mapped to projects
  // If no predefined projects matches, we dynamically generate one.
  const getTopicalHubs = () => {
    if (project.id === 'p-1' || project.name.toLowerCase().includes('saas') || project.domain.includes('saas')) {
      return [
        {
          id: 'hub-saas-1',
          name: 'The Solopreneur SaaS Engine',
          description: 'Topical cluster focused on visual micro-SaaS design, developer tools, and passive software models.',
          keywordTerm: 'micro saas framework',
          difficulty: 45,
          articles: [
            { title: 'Top 7 Best Micro SaaS Ideas for Solo Builders in 2026', keyword: 'best micro saas ideas 2026', role: 'supporting' },
            { title: 'How to Build SaaS Without Coding: The Modern Stack', keyword: 'how to build saas without coding', role: 'supporting' },
            { title: 'SaaS Tech Stack Checklist: Build vs Buy Guide', keyword: 'saas tech stack checklist', role: 'supporting' },
            { title: 'Converting Next.js Webapps to Cross-Platform Desktop Client', keyword: 'convert nextjs to desktop app', role: 'supporting' }
          ]
        },
        {
          id: 'hub-saas-2',
          name: 'No Code & Visual Automation Solutions',
          description: 'Authority hub targeting visual orchestration, bubble databases, and database syncing patterns.',
          keywordTerm: 'no code development blueprint',
          difficulty: 62,
          articles: [
            { title: 'Free Tailwind CSS Boilerplates & UI Templates List', keyword: 'free tailwind templates boilerplate', role: 'supporting' },
            { title: 'How to Build an Automatic Database Backup Node', keyword: 'database backup node', role: 'supporting' },
            { title: 'Top Headless Workflows for Content Automation Scaling', keyword: 'headless workflows for seo', role: 'supporting' }
          ]
        }
      ];
    } else if (project.id === 'p-2' || project.name.toLowerCase().includes('vegan') || project.domain.includes('vegan')) {
      return [
        {
          id: 'hub-veg-1',
          name: 'Plant-Based Muscle & Nutrient Prep Guide',
          description: 'Topical framework establishing high-protein diet guidelines, zinc mapping, and food meal preps.',
          keywordTerm: 'vegan macro nutrient blueprint',
          difficulty: 52,
          articles: [
            { title: '9 High Protein Plant Based Meal Prep Tips for Busy Builders', keyword: 'high protein plant based meal prep', role: 'supporting' },
            { title: 'Easy Vegan Diner Recipes in under 30 minutes', keyword: 'easy vegan dinner recipes 30 mins', role: 'supporting' },
            { title: 'Ultimate Plant Milk Nutrient Brands Compared & Reviewed', keyword: 'best plant milk brands ranked', role: 'supporting' }
          ]
        },
        {
          id: 'hub-veg-2',
          name: 'Alternative Nutrition & Vegan Cheese Crafts',
          description: 'Authoritative subtopical nodes researching Reddit melting cheese, dairy-free ferments, and organic soy clusters.',
          keywordTerm: 'vegan cheese formulation',
          difficulty: 35,
          articles: [
            { title: 'Vegan Cheese that Melts Beautifully: The Reddit Guide', keyword: 'vegan cheese that melts reddit', role: 'supporting' },
            { title: 'Top 5 Nut-Free Vegan Mozzarella Recipes', keyword: 'nut free vegan cheese', role: 'supporting' }
          ]
        }
      ];
    } else {
      // Dynamic fallback based on project friendly name
      return [
        {
          id: 'hub-dyn-1',
          name: `${project.name} Foundations Framework`,
          description: 'Dynamically generated semantic web cluster mapping structural authority pillars.',
          keywordTerm: `${project.domain} authoritative guide`,
          difficulty: 28,
          articles: [
            { title: `How to Optimize ${project.name} Content Framework`, keyword: `how to optimize ${project.name.toLowerCase()}`, role: 'supporting' },
            { title: `Ultimate Search Index Strategies for ${project.domain}`, keyword: `best guides for ${project.domain}`, role: 'supporting' }
          ]
        }
      ];
    }
  };

  const hubs = getTopicalHubs();

  return (
    <div className="space-y-6">

      {/* Explanatory introduction Banner card */}
      <div className="bg-slate-900 border border-slate-800 text-slate-100 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center space-x-2">
            <span className="bg-blue-500/20 text-blue-400 text-[10px] uppercase font-black tracking-widest px-2 py-0.5 border border-blue-500/30 rounded">
              NLP Clustering Mod
            </span>
          </div>
          <h3 className="text-lg font-black tracking-tight text-white font-sans">Semantic Topical Authority Clustering Map</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Outranking groups your target keywords into parent silos to improve core domain authority. Write supporting articles around parent "Pillar Hubs" to secure organic rankings fast.
          </p>
        </div>
        <div className="shrink-0 bg-slate-800 p-4 rounded-2xl border border-slate-700 font-mono text-center min-w-[130px]">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Topical Pillars</span>
          <p className="text-2xl font-black text-blue-400 mt-1">{hubs.length}</p>
        </div>
      </div>

      {/* Authority Pillars clusters maps visual wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hubs.map((hub) => {
          
          // Calculate overall status of sub-articles
          let completedCount = 0;
          let inProgressCount = 0;
          let notCreatedCount = 0;

          hub.articles.forEach(art => {
            const match = projectArticles.find(a => a.targetKeyword.toLowerCase() === art.keyword.toLowerCase());
            if (match) {
              if (match.status === 'Published') completedCount++;
              else inProgressCount++;
            } else {
              notCreatedCount++;
            }
          });

          return (
            <div key={hub.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between gap-5">
              
              <div>
                {/* Upper header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-black">
                      <Folder className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{hub.name}</h4>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold block mt-0.5">
                        Pillar Term: <strong className="text-slate-600">"{hub.keywordTerm}"</strong>
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0 ${
                    hub.difficulty < 40 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    hub.difficulty < 60 ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                    {hub.difficulty}% KD
                  </span>
                </div>

                <p className="text-slate-500 text-xs mt-3.5 leading-relaxed font-sans border-b border-dashed border-slate-100 pb-3">
                  {hub.description}
                </p>

                {/* Sub-articles layout checklist mapping */}
                <div className="mt-4 space-y-2.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Semantic Children Nodes ({hub.articles.length})</span>
                  
                  {hub.articles.map((art, idx) => {
                    const activeArticle = projectArticles.find(a => a.targetKeyword.toLowerCase() === art.keyword.toLowerCase());
                    const exists = !!activeArticle;
                    const isPublished = activeArticle?.status === 'Published';
                    
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-colors ${
                          isPublished ? 'bg-emerald-50/20 border-emerald-100/70' :
                          exists ? 'bg-blue-50/15 border-blue-100/70' :
                          'bg-slate-50/40 border-slate-150'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${exists ? 'text-slate-800' : 'text-slate-500 font-medium'}`}>
                            {art.title}
                          </p>
                          <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                            Target Keyword: "{art.keyword}"
                          </span>
                        </div>

                        {/* Status tag or create draft prompt */}
                        <div className="shrink-0 self-start sm:self-center">
                          {activeArticle ? (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                              isPublished ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              activeArticle.status === 'Ready' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                              activeArticle.status === 'Reviewing' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              'bg-slate-100 text-slate-600 border-slate-150'
                            }`}>
                              {isPublished ? 'Published' : activeArticle.status}
                            </span>
                          ) : (
                            <button
                              onClick={() => onSeedArticle(art.title, art.keyword)}
                              className="px-2 py-1 bg-white hover:bg-white/80 text-blue-600 text-[10px] font-extrabold rounded-lg border border-blue-200 flex items-center gap-1 transition-all shadow-3xs cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Seed Brief</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress and indicators */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-4 text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {completedCount} Published
                  </span>
                  <span className="flex items-center gap-1 text-blue-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {inProgressCount} Drafts
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-350" />
                    {notCreatedCount} Unwritten
                  </span>
                </div>

                <div className="font-mono text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                  {Math.round(((completedCount + inProgressCount) / hub.articles.length) * 100)}% Coverage
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
