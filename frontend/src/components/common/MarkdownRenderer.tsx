import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  fontFamily: 'inherit',
});

const Mermaid = ({ chart }: { chart: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && chart) {
      const renderChart = async () => {
        try {
          // Generate a safe unique ID for mermaid to use
          const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
          
          // Clean up LLM artifacts
          const childrenStr = Array.isArray(chart) ? chart.join('') : String(chart);
          let cleanChart = childrenStr.replace(/```mermaid/g, '').replace(/```/g, '').trim();
          if (cleanChart.startsWith('mermaid\n')) {
             cleanChart = cleanChart.substring(8).trim();
          }

          const { svg } = await mermaid.render(id, cleanChart);
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        } catch (error) {
          console.error('Mermaid rendering failed', error);
          if (containerRef.current) {
            containerRef.current.innerHTML = `<div class="text-rose-500 text-xs border border-rose-500/20 bg-rose-500/10 p-2 rounded">Failed to render diagram. Code:<br/><pre class="mt-2 text-[10px]">${chart}</pre></div>`;
          }
        }
      };
      renderChart();
    }
  }, [chart]);

  return (
    <div 
      ref={containerRef} 
      className="mermaid flex justify-center my-4 p-4 bg-[#0a0d14] border border-white/5 rounded-xl overflow-x-auto w-full" 
    />
  );
};

export const MarkdownRenderer = ({ content }: { content: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const isMermaid = match && match[1] === 'mermaid';

          if (!inline && isMermaid) {
            return <Mermaid chart={String(children).replace(/\n$/, '')} />;
          }

          return !inline ? (
            <div className="bg-[#0a0d14] rounded-md p-3 my-2 overflow-x-auto border border-white/5">
              <code className={`${className} text-xs text-slate-300 font-mono`} {...props}>
                {children}
              </code>
            </div>
          ) : (
            <code className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded text-[11px] font-mono" {...props}>
              {children}
            </code>
          );
        },
        table: ({ children }) => (
          <div className="overflow-x-auto my-4 rounded-lg border border-white/10 bg-[#06080d]">
            <table className="min-w-full text-left text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-[#131825] text-slate-300 text-xs uppercase tracking-wider">{children}</thead>,
        th: ({ children }) => <th className="px-4 py-3 border-b border-white/10 font-bold whitespace-nowrap">{children}</th>,
        td: ({ children }) => <td className="px-4 py-3 border-b border-white/5 text-slate-400">{children}</td>,
        a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="text-purple-400 hover:text-purple-300 transition hover:underline font-medium">{children}</a>,
        p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-sm text-slate-300">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-sm text-slate-300">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-sm text-slate-300">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        h1: ({ children }) => <h1 className="text-lg font-bold text-white mt-5 mb-3 tracking-wide">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold text-white mt-4 mb-2 tracking-wide">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-bold text-white mt-3 mb-2">{children}</h3>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-purple-500/50 pl-3 py-1 my-3 bg-purple-500/5 rounded-r italic text-slate-400">{children}</blockquote>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
