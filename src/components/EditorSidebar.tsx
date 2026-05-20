import React, { useState } from 'react';
import { 
  CheckCircle2, 
  X, 
  Sparkles, 
  Clock, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  BookOpen,
  HelpCircle,
  HelpCircle as QuestionIcon,
  Plus,
  Compass
} from 'lucide-react';
import { Article } from '../types';
import { getSecondaryKeywords, getCompetitorPages, getSerpQuestions } from '../data/mockData';
import { parseMarkdownStructure, evaluateSeoMetrics } from '../utils/seoAnalyzer';

function countOccurrences(text: string, substring: string): number {
  if (!text || !substring) return 0;
  const escaped = substring.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'gi');
  return (text.match(regex) || []).length;
}

interface EditorSidebarProps {
  article: Article;
  onAppendText: (text: string) => void;
  onAIOptimize: () => void;
}

export default function EditorSidebar({ article, onAppendText, onAIOptimize }: EditorSidebarProps) {
  const [sidebarTab, setSidebarTab] = useState<'nlp' | 'serp' | 'brief'>('nlp');

  const secondaryList = getSecondaryKeywords(article.targetKeyword);
  const competitors = getCompetitorPages(article.targetKeyword);
  const questions = getSerpQuestions(article.targetKeyword);
  const metrics = parseMarkdownStructure(article.content);
  const scoreDetails = evaluateSeoMetrics(article, secondaryList);

  // Compute averages for competitors
  const avgCompetitorWordCount = Math.round(competitors.reduce((acc, c) => acc + c.wordCount, 0) / competitors.length);
  const avgCompetitorHeadings = Math.round(competitors.reduce((acc, c) => acc + c.headingsCount, 0) / competitors.length);

  return (
    <div className="space-y-6">
      
      {/* Radial score card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center text-center">
        <h4 className="font-extrabold text-slate-900 tracking-tight text-sm self-start mb-4">On-Page SEO Score</h4>
        
        {/* Round indicator block */}
        <div className="relative h-32 w-32 flex items-center justify-center mb-4">
          <svg className="absolute inset-0 h-full w-full transform -rotate-90">
            <circle 
              cx="64" 
              cy="64" 
              r="52" 
              className="stroke-slate-100 fill-none" 
              strokeWidth="9" 
            />
            <circle 
              cx="64" 
              cy="64" 
              r="52" 
              className={`fill-none transition-all duration-300 ${
                scoreDetails.total >= 90 ? 'stroke-emerald-500' :
                scoreDetails.total >= 70 ? 'stroke-blue-500' : 'stroke-amber-500'
              }`}
              strokeWidth="9" 
              strokeDasharray={2 * Math.PI * 52}
              strokeDashoffset={2 * Math.PI * 52 * (1 - scoreDetails.total / 100)}
              strokeLinecap="round"
            />
          </svg>

          <div className="flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-slate-900 leading-none">{scoreDetails.total}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">out of 100</span>
          </div>
        </div>

        <p className={`text-xs font-bold ${
          scoreDetails.total >= 90 ? 'text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full' :
          scoreDetails.total >= 70 ? 'text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full' :
          'text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full'
        }`}>
          {scoreDetails.total >= 90 ? 'Perfect Content Optimization!' :
           scoreDetails.total >= 70 ? 'On-Page SEO Base looks great' :
           'SEO alerts found, see checks'}
        </p>
      </div>

      {/* Main Tabbed card panel */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col">
        
        {/* Tab Header bar */}
        <div className="border-b border-slate-100 bg-slate-50 p-1.5 flex gap-1">
          {[
            { id: 'nlp' as const, label: 'NLP Keywords', icon: Sparkles },
            { id: 'serp' as const, label: 'SERP Competitors', icon: TrendingUp },
            { id: 'brief' as const, label: 'Outline brief', icon: BookOpen }
          ].map(tab => {
            const TabIcon = tab.icon;
            const active = sidebarTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSidebarTab(tab.id)}
                className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                  active 
                    ? 'bg-white text-slate-900 shadow-3xs' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/55'
                }`}
              >
                <TabIcon className={`h-3.5 w-3.5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content screens */}
        <div className="p-5 max-h-[450px] overflow-y-auto space-y-4">

          {/* ======================= */}
          {/* TAB 1: NLP KEYWORDS */}
          {/* ======================= */}
          {sidebarTab === 'nlp' && (
            <div className="space-y-4">
              
              <div>
                <h5 className="text-xs font-black uppercase text-slate-400 tracking-wider">Primary Target Metric</h5>
                <div className="mt-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-black text-slate-900 truncate">"{article.targetKeyword}"</p>
                    <span className="text-[10px] text-slate-400 leading-normal block mt-0.5">
                      Recommended Density count: <strong>2 - 5 times</strong>
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    {(() => {
                      const primaryCount = countOccurrences(article.content, article.targetKeyword);
                      const optimal = primaryCount >= 2 && primaryCount <= 5;
                      const stuffed = primaryCount > 5;
                      return (
                        <>
                          <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                            optimal ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            stuffed ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            'bg-amber-50 text-amber-750 border border-amber-100'
                          }`}>
                            {primaryCount} Placed
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold block mt-1.5 leading-none">
                            {optimal ? 'Optimal Coverage' : stuffed ? 'KEYWORD STUFFING!' : 'Under-optimized'}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Secondary Semantic Terms list */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h5 className="text-xs font-black uppercase text-slate-400 tracking-wider">Secondary LSI/NLP Terms</h5>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    Covered: {scoreDetails.nlpCoverageCount} / {secondaryList.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {secondaryList.map((termItem) => {
                    const currentCount = countOccurrences(article.content, termItem.term);
                    const optimal = currentCount >= termItem.min && currentCount <= termItem.max;
                    const nestedOver = currentCount > termItem.max;
                    const missing = currentCount === 0;

                    return (
                      <div key={termItem.term} className="p-3 bg-white hover:bg-slate-50/50 rounded-2xl border border-slate-150 flex flex-col gap-1.5 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800 truncate" title={termItem.term}>
                            {termItem.term}
                          </span>
                          <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded leading-none ${
                            optimal ? 'bg-emerald-50 text-emerald-700' :
                            nestedOver ? 'bg-rose-50 text-rose-700' :
                            missing ? 'bg-slate-100 text-slate-400' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {optimal ? 'Good' : nestedOver ? 'Over' : missing ? 'Missing' : 'Low'}
                          </span>
                        </div>

                        {/* Progress Bar slider info */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] font-mono font-bold text-slate-400">
                            <span>Count: {currentCount} mentions</span>
                            <span>Target: {termItem.min}-{termItem.max}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                optimal ? 'bg-emerald-500' :
                                nestedOver ? 'bg-rose-500' : 'bg-amber-500'
                              }`} 
                              style={{ width: `${Math.min(100, (currentCount / (termItem.max || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ======================= */}
          {/* TAB 2: COMPETITORS */}
          {/* ======================= */}
          {sidebarTab === 'serp' && (
            <div className="space-y-5">
              
              {/* Comparative Progress bars against Page 1 averages */}
              <div>
                <h5 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2.5">Competitor Averages vs You</h5>
                
                <div className="space-y-4">
                  {/* Wordcount progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Article Length</span>
                      <span className="font-mono text-slate-500">You: {metrics.wordCount} / Target: {avgCompetitorWordCount}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${metrics.wordCount >= avgCompetitorWordCount ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                        style={{ width: `${Math.min(100, (metrics.wordCount / (avgCompetitorWordCount || 1)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {metrics.wordCount >= avgCompetitorWordCount 
                        ? '✓ Word count meets authority benchmark guidelines' 
                        : `Increase content draft depth by ${avgCompetitorWordCount - metrics.wordCount} words`}
                    </p>
                  </div>

                  {/* Headings count progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Subheadings (H2/H3)</span>
                      <span className="font-mono text-slate-500">You: {metrics.h2Count + metrics.h3Count} / Target: {avgCompetitorHeadings}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          (metrics.h2Count + metrics.h3Count) >= avgCompetitorHeadings ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} 
                        style={{ width: `${Math.min(100, ((metrics.h2Count + metrics.h3Count) / (avgCompetitorHeadings || 1)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Create hierarchical clusters using headings to improve user search experience.
                    </p>
                  </div>
                </div>
              </div>

              {/* SERP Rank List */}
              <div className="border-t border-slate-100 pt-4">
                <h5 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2.5">Serp Page 1 Competitor Profiles</h5>
                
                <div className="space-y-2.5">
                  {competitors.map((comp) => (
                    <div key={comp.rank} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between hover:bg-slate-100/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="h-5 w-5 bg-slate-800 text-white rounded-md text-[10px] font-black flex items-center justify-center shrink-0">
                            #{comp.rank}
                          </span>
                          <span className="text-xs font-bold text-slate-800 truncate">{comp.domain}</span>
                        </div>
                        <span className={`text-[9px] uppercase font-black px-1.5 py-0.2 rounded ${
                          comp.authority === 'Elite' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          comp.authority === 'Great' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          'bg-slate-200 text-slate-600'
                        }`}>
                          {comp.authority} Auth
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2.5 text-[10px] font-mono text-slate-400 font-bold leading-none">
                        <span>Word count: {comp.wordCount}</span>
                        <span>Headings: {comp.headingsCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ======================= */}
          {/* TAB 3: OUTLINE/PAA */}
          {/* ======================= */}
          {sidebarTab === 'brief' && (
            <div className="space-y-4">
              
              {/* Brief construct prompt notice */}
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-[11px] text-indigo-950 leading-relaxed font-medium">
                Add search-aligned subtopics to construct clean briefs. Clicking on these queries appends them directly as markdown headings!
              </div>

              {/* PAA questions list */}
              <div>
                <h5 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">People Also Ask (From SERP Scrapes)</h5>
                
                <div className="space-y-2">
                  {questions.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => {
                        const headingText = `\n\n## ${q.question}\nType your answer here utilizing proper NLP density clusters...\n`;
                        onAppendText(headingText);
                      }}
                      className="w-full p-3 bg-white text-left text-xs font-bold text-slate-700 rounded-2xl border border-slate-150 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-start gap-2.5 cursor-pointer group"
                    >
                      <Plus className="h-4 w-4 text-blue-600 shrink-0 mt-0.5 group-hover:scale-125 transition-transform" />
                      <div>
                        <span>{q.question}</span>
                        <span className="text-[9px] font-mono text-slate-400 block mt-1 uppercase font-normal">{q.source}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Competitor Heading clusters */}
              <div className="border-t border-slate-100 pt-4">
                <h5 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Common Competitor Header Outlines</h5>
                
                <div className="space-y-2">
                  {[
                    `Why is ${article.targetKeyword} important?`,
                    `Advanced optimizations checklist`,
                    `Step-by-step tutorial implementation`,
                    `Common pitfalls to avoid`
                  ].map((heading, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const headingText = `\n\n## ${heading}\nAdd structured content here to cover competitor clusters...\n`;
                        onAppendText(headingText);
                      }}
                      className="w-full py-2 px-3 bg-slate-50 text-left text-xs text-slate-600 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate font-semibold">{heading}</span>
                      <ChevronRight className="h-3 w-3 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
        
        {/* Right side lower actions card footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-bold font-mono">Outranking Pro Module</span>
          <button
            onClick={onAIOptimize}
            className="text-xs font-extrabold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Density Fix</span>
          </button>
        </div>

      </div>

    </div>
  );
}
