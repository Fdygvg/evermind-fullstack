import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock'; // Wrapping our intelligent Prism/Detection engine
import '../css/markdown-content.css';

/**
 * @components/Common/MarkdownContent
 * 
 * Architectural Intent: "Intentional Minimalism"
 * 
 * Provides rapid, semantic parsing of raw text into heavily optimized, 
 * accessible HTML via ReactMarkdown. Leverages the AST pipeline to intercept `code` 
 * blocks, injecting the application's native `<CodeBlock>` engine (Prism-based) 
 * preventing duplicate syntax-highlighting logic.
 * 
 * Edge Cases Handled:
 * - Table Overflow: Injected wrap-container on `table` to prevent mobile breakage.
 * - FOUC/Jank: Wrapped in `React.memo` to eliminate re-rendering when parent 
 *   card state changes (e.g. flipping).
 * - Spacing: Binds to custom `.markdown-body` class for specific line-heights 
 *   and marginal mathematics, rejecting generic browser defaults.
 */
const MarkdownContent = memo(({ content }) => {
    if (!content) return null;

    return (
        <div className="markdown-body">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Intercept code nodes. 
                    // (Note: `react-markdown` v10+ removed the `inline` prop. We evaluate via `match` and text shape)
                    pre({ children }) {
                        // Strip default `<pre>` wrappers to prevent semantic explosion since CodeBlock/SyntaxHighlighter brings its own
                        return <>{children}</>;
                    },
                    code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : null;
                        const textContent = String(children).replace(/\n$/, '');

                        // Determine if it's block-level code. Definitive if it has a language tag,
                        // or if it physically spans multiple lines. Single backticks will evaluate false.
                        const isBlock = match || textContent.includes('\n');

                        if (isBlock) {
                            // Block-level code: Delegate to our robust CodeBlock engine
                            return (
                                <CodeBlock
                                    text={textContent}
                                    language={language || 'javascript'}
                                    forceCode={true} // Bypass heuristic detection, Markdown AST confirms it's a block
                                />
                            );
                        }

                        // Inline code: Render subtle, hardware-accelerated tint
                        return (
                            <code className="inline-code" {...props}>
                                {children}
                            </code>
                        );
                    },
                    // Intercept tables to enforce mobile responsiveness (Overflow Trap Prevention)
                    table({ children, ...props }) {
                        return (
                            <div className="table-responsive-wrapper">
                                <table {...props}>{children}</table>
                            </div>
                        );
                    },
                    // Enhance links with security attributes
                    a({ children, href, ...props }) {
                        // Basic javascript: protocol stripping handled by react-markdown safely,
                        // but we enforce target_blank and rel=noreferrer for external links
                        const isExternal = href && (href.startsWith('http') || href.startsWith('//'));
                        return (
                            <a
                                href={href}
                                target={isExternal ? "_blank" : undefined}
                                rel={isExternal ? "noopener noreferrer" : undefined}
                                {...props}
                            >
                                {children}
                            </a>
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
});

// Explicitly set displayName for memoized components during debugging
MarkdownContent.displayName = 'MarkdownContent';

export default MarkdownContent;
