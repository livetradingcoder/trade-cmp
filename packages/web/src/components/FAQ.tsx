import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

const FAQItem = ({ question, answer, isOpen, onClick }: FAQItemProps) => {
  return (
    <div className='faq-item'>
      <button onClick={onClick} className={`faq-button ${isOpen ? "open" : ""}`}>
        <span className='faq-question'>{question}</span>
        <span className={`faq-icon ${isOpen ? "open" : ""}`}>{isOpen ? <X size={18} /> : <Plus size={18} />}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <p className='faq-answer'>{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(1);

  const faqs = [

    {
      question: "What is Live Trading League?",
      answer:
        "LiveTradingLeague is a new approach for real trading competitions where traders compete using their own capital for real cash rewards.",
    },
    {
      question: "What is the minimum required capital to start with?",
      answer:
        "Participants are free to trade with any higher amount they are comfortable with. The stated amount represents the minimum personal trading capital required. Your capital stays in your account at all times, and all the profits made will be yours.",
    },
    {
      question: "What is the Leverage limit?",
      answer: "Up to 1:500.",
    },
    {
      question: "Do I need to pay a trading fee?",
      answer:
        "No, there is no entry fee. To participate, you only need to fund your trading account with the required starting balance. This balance remains fully yours at all times.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className='faq-section section-container'>
      <div className='faq-grid'>
        {/* Left Side: Header */}
        <div className='faq-header'>
          <div className='faq-header-inner'>
            <h2 className='faq-title'>
              Frequently Asked <br />
              <span className='text-gradient'>Questions</span>
            </h2>
            <p className='faq-subtitle'>
              Something left unanswered? Check out the full <Link to="/terms" style={{ color: 'var(--primary)', fontWeight: '600' }}>Terms and Conditions</Link> for detailed information about our platform and rules.
            </p>
          </div>
        </div>

        {/* Right Side: Accordion */}
        <div className='faq-content'>
          <div className='glass-panel faq-panel'>
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onClick={() => toggleFAQ(index)}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
                .faq-section {
                    position: relative;
                    z-index: 10;
                    padding: 80px 24px;
                }

                .faq-grid {
                    display: grid;
                    grid-template-columns: 1fr 1.2fr;
                    gap: 60px;
                    align-items: start;
                }

                .faq-header-inner {
                    position: sticky;
                    top: 120px;
                }

                .faq-title {
                    font-size: clamp(2rem, 5vw, 3rem);
                    font-weight: 800;
                    margin-bottom: 24px;
                    line-height: 1.1;
                }

                .faq-subtitle {
                    color: var(--text-dim);
                    font-size: clamp(0.95rem, 1.5vw, 1.1rem);
                    margin-bottom: 32px;
                    max-width: 400px;
                    line-height: 1.6;
                }

                .faq-panel {
                    padding: 24px 32px;
                    border-radius: 24px;
                }

                .faq-item {
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }

                .faq-item:last-child {
                    border-bottom: none;
                }

                .faq-button {
                    width: 100%;
                    padding: 20px 0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    text-align: left;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--text-dim);
                    transition: color 0.3s ease;
                    gap: 16px;
                }

                .faq-button.open {
                    color: var(--text-main);
                }

                .faq-question {
                    font-size: clamp(0.95rem, 1.5vw, 1.1rem);
                    font-weight: 600;
                }

                .faq-icon {
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: 1px solid rgba(255,255,255,0.1);
                    color: var(--text-dim);
                    background: transparent;
                    transition: all 0.3s ease;
                }

                .faq-icon.open {
                    border-color: var(--primary-glow);
                    color: var(--primary);
                    background: rgba(0, 102, 255, 0.1);
                    transform: rotate(45deg);
                }

                .faq-answer {
                    padding-bottom: 20px;
                    color: var(--text-muted);
                    line-height: 1.6;
                    font-size: clamp(0.9rem, 1.3vw, 1rem);
                }

                @media (max-width: 900px) {
                    .faq-grid {
                        grid-template-columns: 1fr;
                        gap: 40px;
                    }
                    .faq-header {
                        text-align: center;
                    }
                    .faq-header-inner {
                        position: static;
                    }
                    .faq-subtitle {
                        max-width: none;
                        margin-left: auto;
                        margin-right: auto;
                    }
                }

                @media (max-width: 480px) {
                    .faq-panel {
                        padding: 16px 20px;
                    }
                    .faq-button {
                        padding: 16px 0;
                    }
                }
            `}</style>
    </section>
  );
}
