import React, { useState } from 'react';

const qaData = [
  {
    chapter: "Chapter 9 & 10: STP and Positioning",
    items: [
      {
        id: 1,
        title: "Case 1 (Geographic Segmentation)",
        question: "A clothing company sells light cotton clothing in hot regions and winter jackets in colder regions. Why is this approach necessary?",
        answer: "This approach uses Geographic Segmentation, which divides the market according to location or climate. The company recognizes that customers in different climates have different physical needs, so one marketing strategy would not work equally well everywhere."
      },
      {
        id: 2,
        title: "Case 2 (Demographic Segmentation)",
        question: "A smartphone manufacturer offers budget phones for lower-income customers, mid-range phones for middle-income earners, and premium phones for high-income executives. What segmentation base is being used?",
        answer: "The manufacturer is using Demographic Segmentation, specifically segmenting by income. This method divides customers according to measurable population characteristics, acknowledging that income directly influences buying power and product preferences."
      },
      {
        id: 3,
        title: "Case 3 (Psychographic Segmentation & VALS)",
        question: "Two consumers earn the exact same salary. One buys a newly launched premium technology product because they enjoy trying innovations (Innovator), while the other buys a familiar brand they have trusted for years (Believer). How do marketers explain this difference?",
        answer: "This is explained by Psychographic Segmentation and the VALS framework. It divides consumers based on psychological motivations, lifestyles, and values, proving that demographic similarities do not always lead to identical buying behaviors."
      },
      {
        id: 4,
        title: "Case 4 (Behavioral Segmentation - Loyalty)",
        question: "A customer always buys the exact same soft drink brand and refuses alternatives, while another customer chooses whichever detergent has the best promotion that week. What are their loyalty statuses?",
        answer: "The first customer is a \"Hard-Core Loyal\" because they exclusively purchase one brand. The second customer is a \"Switcher,\" showing no loyalty and frequently changing brands based on immediate deals."
      },
      {
        id: 5,
        title: "Case 5 (Behavioral Segmentation - Occasion & Usage)",
        question: "A telecom company designs special data packages for \"heavy data users,\" while a chocolate brand heavily promotes its products as \"A sweet gift for Valentine's Day.\" Which behavioral variables are in play?",
        answer: "The telecom company is segmenting by \"Usage Rate,\" paying special attention to heavy users who often account for a large proportion of total consumption. The chocolate brand is using \"Occasion\" segmentation, targeting purchases tied to specific events."
      },
      {
        id: 6,
        title: "Case 6 (Targeting Strategies - Mass vs Differentiated)",
        question: "A company selling basic salt targets the entire market with a single strategy, whereas an automobile company offers a small car for young drivers and a luxury SUV for large families. Compare their targeting strategies.",
        answer: "The salt company uses Mass Marketing (undifferentiated), assuming everyone is a customer and focusing on economies of scale. The auto company uses Differentiated Marketing, evaluating multiple market segments and developing different offerings for each."
      },
      {
        id: 7,
        title: "Case 7 (Targeting Strategies - Niche vs Micromarketing)",
        question: "An athletic brand sells running shoes exclusively designed for serious marathon runners. Meanwhile, an e-commerce platform recommends completely different products to individual shoppers based on their search history. Identify these strategies.",
        answer: "The athletic brand relies on Niche Marketing, focusing on a small, specialized segment to build strong loyalty and avoid direct mass competition. The e-commerce platform uses Micromarketing (specifically Individual Marketing or one-to-one marketing), tailoring programs to specific individuals."
      },
      {
        id: 8,
        title: "Case 8 (Positioning - Value Propositions)",
        question: "A luxury hotel offers superior rooms and exclusive service at a premium price, while a retailer claims to offer \"similar quality, lower price\" compared to competitors. What are their value propositions?",
        answer: "The luxury hotel is using a \"More for More\" positioning strategy, providing superior benefits for higher costs. The retailer is using a \"Same for Less\" strategy, positioning itself as a comparable alternative at a discount to win over cost-conscious buyers."
      },
      {
        id: 9,
        title: "Case 9 (Point of Parity vs. Point of Difference)",
        question: "A new smartphone has a good camera and internet access, but markets itself primarily on having exceptional gaming performance. Define its POPs and PODs.",
        answer: "The camera and internet are Category Points of Parity (POP), which are basic attributes necessary to be considered a legitimate smartphone. The gaming performance is its Point of Difference (POD) because it is a desirable, deliverable, and differentiating benefit that competitors lack."
      },
      {
        id: 10,
        title: "Case 10 (Big Case Study - Comprehensive STP)",
        question: "Imagine a new coffee shop opens near a university. It groups potential customers into students, teachers, and office workers. It decides to focus entirely on university students. It designs its image as \"Affordable, trendy coffee for students who want to hang out,\" and internally adopts the Brand Mantra \"Coffee Joyful Connection.\"",
        answer: "The shop first executed Segmentation by dividing the heterogeneous market into meaningful groups (students, teachers, workers). It then applied Targeting by selecting students to serve. Finally, it established Positioning by occupying a distinct, desirable place in students' minds (affordable/trendy). Its Brand Mantra guides this internally, with \"Coffee\" as the descriptive modifier, \"Joyful\" as the emotional modifier, and \"Connection\" as the function modifier."
      }
    ]
  },
  {
    chapter: "Chapter 6: Consumer Behavior",
    items: [
      {
        id: 11,
        title: "Case 11 (Cultural Factors)",
        question: "A global fast-food brand operating in Bangladesh modifies its menu to feature rice, fish, and biryani instead of its standard global items. Why is this necessary?",
        answer: "This is driven by Cultural Factors. Culture dictates shared values, beliefs, and acceptable behaviors—including food preferences. A brand must adapt to local cultures because cultural norms deeply influence what consumers consider desirable to buy."
      },
      {
        id: 12,
        title: "Case 12 (Social Factors - Reference Groups)",
        question: "A student joins a university business club and buys the formal wear preferred by the club members. Later, they avoid a specific clothing style because they dislike the group associated with it. Identify the groups.",
        answer: "The business club acts as a Secondary Membership Group, which is a formal group that influences attitudes and behaviors. The group the student avoids is a Dissociative Group, meaning the consumer deliberately rejects products associated with people they do not want to resemble."
      },
      {
        id: 13,
        title: "Case 13 (Personal Factors - Life Stage)",
        question: "A young, unmarried consumer spends mostly on fashion, smartphones, and entertainment. Ten years later, as part of a married couple with young children, their spending shifts to baby food, diapers, and healthcare. What explains this?",
        answer: "This shift is explained by the consumer's Life Stage. They transitioned from the \"Young Single\" stage to the \"Full Nest I\" stage. Different life stages create entirely different needs, priorities, and spending patterns, regardless of age."
      },
      {
        id: 14,
        title: "Case 14 (Psychological Factors - Maslow)",
        question: "A consumer purchases basic bottled water to quench their thirst, and later signs up for a creative professional development program to fulfill their potential. Which needs are being met?",
        answer: "According to Maslow's Hierarchy of Needs, the bottled water satisfies Level 1: Physiological Needs (basic survival). The professional development program satisfies Level 5: Self-Actualization, which is the desire for personal growth and creativity."
      },
      {
        id: 15,
        title: "Case 15 (Perception - Selective Distortion & Retention)",
        question: "A loyal fan of Brand A reads a review stating Brand B is better. The fan assumes the reviewer is ignorant (distortion) and completely forgets the negative points mentioned about Brand A a week later (retention). Why?",
        answer: "Consumers use Selective Distortion to interpret information in a way that fits their existing beliefs. They use Selective Retention to easily remember information that supports their brand preference while naturally discarding contradicting data."
      },
      {
        id: 16,
        title: "Case 16 (Information Search & Choice Sets)",
        question: "A student needs a phone and knows about Apple, Samsung, Vivo, and Xiaomi (Awareness Set). They only seriously evaluate Samsung and Xiaomi (Choice Set). What does this tell marketers?",
        answer: "It demonstrates that Awareness does not equal Consideration. Just because a consumer knows a brand exists does not mean they will seriously evaluate it for purchase; marketers must strive to move their brand from the total set into the final choice set."
      },
      {
        id: 17,
        title: "Case 17 (Evaluation - Expectancy-Value Model)",
        question: "A student evaluating two phones gives \"Camera\" a high importance score and \"Price\" a lower importance score. Even though Phone B is cheaper, Phone A scores higher overall because of its superior camera. How does this model work?",
        answer: "The Expectancy-Value Model evaluates brands based on how important an attribute is to the consumer multiplied by how strongly they believe the brand performs on that attribute. It proves the \"best\" product varies because different customers assign different importance weights."
      },
      {
        id: 18,
        title: "Case 18 (Post-purchase Behavior)",
        question: "A customer spends Tk. 100,000 on a laptop but starts doubting their decision after seeing another model online. The brand immediately sends follow-up support and positive reviews. What is happening?",
        answer: "The customer is experiencing Post-purchase Cognitive Dissonance, or psychological discomfort and doubt after a major purchase. The brand is actively trying to reduce this dissonance through reassurance and follow-up communication to ensure long-term satisfaction."
      },
      {
        id: 19,
        title: "Case 19 (Decision Heuristics)",
        question: "A consumer sees a shirt marked \"Now Tk. 1,800 (Originally Tk. 3,000)\" and feels it's a great deal. Later, they judge a restaurant as highly popular just because they easily recall viral posts about it. Which heuristics are used?",
        answer: "The shirt pricing utilizes the Anchoring and Adjustment Heuristic, where the initial Tk. 3,000 acts as an anchor influencing their perception of the final price. The restaurant judgment uses the Availability Heuristic, judging commonality based on how easily examples come to mind."
      },
      {
        id: 20,
        title: "Case 20 (Big Case Study - Comprehensive Consumer Journey)",
        question: "A student is hungry (Need Recognition triggered internally). They search Google for the \"Best burger\" (Information Search) and find a highly-rated local shop. Upon arriving, they see people in suits eating there and assume it must be premium quality (Representativeness Heuristic). After eating, they feel the burger perfectly matched their high expectations (Satisfaction). What does this map to?",
        answer: "This maps the Consumer Buying Decision Process. The internal stimulus drove the search phase, while mental shortcuts (heuristics) sped up their evaluation of the restaurant's quality. Finally, their post-purchase behavior resulted in satisfaction because performance equaled expectations."
      }
    ]
  },
  {
    chapter: "Chapter 1: Marketing Introduction",
    items: [
      {
        id: 21,
        title: "Case 21 (Core Concepts - Value)",
        question: "A consumer buys an Apple iPhone not just for calls, but for camera quality, status, security, and the Apple ecosystem. What marketing concept does this illustrate?",
        answer: "This illustrates that marketing is about creating and delivering Value. Customers do not simply buy a physical product; they buy the bundle of benefits, experiences, and status they believe they will receive."
      },
      {
        id: 22,
        title: "Case 22 (Need vs Want vs Demand)",
        question: "A student is hungry (Need) and craves an expensive sushi dinner (Want), but only has money for a basic burger. Is there a demand for sushi?",
        answer: "No, there is no Demand for sushi in this scenario. While the student has the need and the want, a demand only exists when a want is backed by both the purchasing power and the willingness to buy."
      },
      {
        id: 23,
        title: "Case 23 (Demand States - Negative & Nonexistent)",
        question: "People avoid a new vaccination out of fear of injections. Meanwhile, an overly complex software tool generates zero interest from average consumers. Identify the demand states and required marketing responses.",
        answer: "The vaccination faces Negative Demand, requiring Conversion Marketing to change negative attitudes. The software faces Nonexistent Demand, requiring marketers to Stimulate demand by educating consumers on its value."
      },
      {
        id: 24,
        title: "Case 24 (Demand States - Latent & Declining)",
        question: "Before smartphones, consumers secretly desired a single device for music, maps, and calls, but none existed. Today, traditional DVDs are losing sales every year. Identify these demand states.",
        answer: "The pre-smartphone desire was Latent Demand, representing an unmet need that required innovation. The DVD market is experiencing Declining Demand, requiring Remarketing strategies like finding new uses or target segments to survive."
      },
      {
        id: 25,
        title: "Case 25 (Demand States - Irregular, Overfull, Unwholesome)",
        question: "A hotel struggles with low off-season bookings, a concert has double the ticket requests it can handle, and the government wants to reduce tobacco sales. Match the marketing responses.",
        answer: "The hotel must use Synchromarketing to balance its Irregular Demand. The concert must use Demarketing to manage its Overfull Demand by raising prices or limiting purchases. The government uses Countermarketing to discourage Unwholesome Demand."
      },
      {
        id: 26,
        title: "Case 26 (Media Types - Paid, Owned, Earned)",
        question: "A brand runs Google Search ads, posts an article on its own company blog, and goes viral when consumers voluntarily share reviews. Categorize these media forms.",
        answer: "The Google ads are Paid Media, where exposure is bought. The blog is Owned Media, which the company entirely controls. The viral consumer reviews are Earned Media, generated organically by others without direct payment."
      },
      {
        id: 27,
        title: "Case 27 (Native Advertising)",
        question: "A user reading a news website clicks an article titled \"5 Ways to Save Money,\" only to realize at the end that it is actually a sponsored post by a bank, designed to look exactly like a standard news article. What is this?",
        answer: "This is Native Advertising. It is promotional content designed to mimic the look, feel, and format of the surrounding non-paid content on the platform, though it should still be clearly labeled as sponsored to avoid deception."
      },
      {
        id: 28,
        title: "Case 28 (New Realities - AI & Search)",
        question: "A consumer asks an AI assistant, \"Which smartphone is best for a student?\" and receives a summarized answer instead of a list of website links. How must marketers adapt?",
        answer: "Marketers must shift from traditional Search Engine Optimization (SEO) to Answer Engine Optimization (AEO). They must structure their content so that AI systems easily understand and surface it in generated answers, adapting to AI-powered search realities."
      },
      {
        id: 29,
        title: "Case 29 (New Realities - Social Commerce)",
        question: "A consumer wants biryani, searches for \"Best biriyani in Dhaka\" directly in the Instagram search bar, watches a Reel, and orders directly through the app without visiting a website. What trends does this show?",
        answer: "This highlights two new realities: \"Social Media Is Becoming Search,\" where platforms act as discovery engines, and the rise of \"Social Commerce,\" where the entire journey from discovery to shopping happens within the social platform."
      },
      {
        id: 30,
        title: "Case 30 (Big Case Study - Modern Marketing Ecosystem)",
        question: "A new theme park has Overfull Demand during holidays but Irregular Demand on weekdays. To fix this, they launch short-form, unpolished behind-the-scenes videos on TikTok to build authenticity. They also face intense competition for attention against Netflix and video games.",
        answer: "The park must apply Demarketing for holidays (e.g., higher prices) and Synchromarketing for weekdays (discounts). Their TikTok strategy leverages the reality that Authenticity is often more valuable than high-production value, and Short-Form Video is powerful. Finally, they recognize the modern reality that brands compete for consumer Attention against all forms of digital entertainment, not just direct industry competitors."
      }
    ]
  }
];

const QACard = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-4 transition-all hover:shadow-md">
      <div 
        className="p-5 cursor-pointer flex justify-between items-start gap-4 bg-slate-50 hover:bg-slate-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        aria-expanded={isOpen}
      >
        <div className="flex-1">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2 block">
            {item.title}
          </span>
          <h3 className="text-slate-800 font-semibold leading-relaxed text-[15px] sm:text-base">
            {item.question}
          </h3>
        </div>
        <div className="mt-1">
          <div className={`w-8 h-8 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-indigo-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>
      
      <div 
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="p-5 border-t border-slate-100 bg-white">
            <div className="flex gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                A
              </div>
              <p className="text-slate-600 leading-relaxed text-[15px] sm:text-base pt-1">
                {item.answer}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MarketingManagementMid() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">MKT Management</h1>
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
            </svg>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        


        {/* Tabs */}
        <div className="flex overflow-x-auto pb-4 mb-4 gap-2 snap-x hide-scrollbar">
          {qaData.map((chapter, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`snap-start whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === index 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {chapter.chapter}
            </button>
          ))}
        </div>

        {/* Q&A List */}
        <div className="mt-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">
              {qaData[activeTab].chapter}
            </h2>
            <span className="text-sm font-medium text-slate-500 bg-slate-200 px-3 py-1 rounded-full">
              {qaData[activeTab].items.length} Cases
            </span>
          </div>

          <div className="space-y-4">
            {qaData[activeTab].items.map((item) => (
              <QACard key={item.id} item={item} />
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 text-sm pb-8">
          <p>Created by <a href="/" className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors">Gazi Seeyam</a></p>
        </div>

      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
