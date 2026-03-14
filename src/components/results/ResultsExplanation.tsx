import React from 'react';

type ResultsExplanationProps = {
  dominantStyles: string[];
};

const ResultsExplanation: React.FC<ResultsExplanationProps> = ({ dominantStyles }) => {
  const getExplanation = (style: string) => {
    switch (style) {
      case 'V':
        return {
          title: 'Visual Learner',
          description: "You process information best when it's presented visually. Charts, diagrams, and demonstrations help you understand and remember concepts more effectively.",
          tips: [
            "Use color-coding and highlighters in your notes",
            "Convert text information into diagrams, charts, and mindmaps",
            "Watch video demonstrations before attempting new tasks",
            "Use flashcards with images and visual cues"
          ]
        };
      case 'A':
        return {
          title: 'Auditory Learner',
          description: "You learn best through listening and verbal communication. Discussions, lectures, and talking through ideas help you process information effectively.",
          tips: [
            "Record lectures or read your notes aloud to review later",
            "Discuss concepts with others to solidify understanding",
            "Use mnemonic devices and rhymes to remember information",
            "Consider audiobooks or podcast learning materials"
          ]
        };
      case 'R':
        return {
          title: 'Read/Write Learner',
          description: "You prefer information displayed as words. Reading and writing help you understand and remember concepts most effectively.",
          tips: [
            "Take detailed notes and rewrite them to enhance memory",
            "Convert diagrams and charts into written descriptions",
            "Create lists, headings, and organized notes",
            "Look for text-based resources rather than visual or interactive ones"
          ]
        };
      case 'K':
        return {
          title: 'Kinesthetic Learner',
          description: "You learn through doing, experiencing, and hands-on activities. Physical involvement helps you understand and remember information.",
          tips: [
            "Use physical objects or models when possible",
            "Take breaks to move around while studying",
            "Apply concepts to real-world scenarios or case studies",
            "Create physical flashcards you can manipulate and arrange"
          ]
        };
      default:
        return {
          title: 'Balanced Learner',
          description: "You have a flexible learning style and can adapt to different teaching methods.",
          tips: [
            "Use a variety of learning techniques",
            "Adapt your approach based on the subject matter",
            "Take advantage of different resources available",
            "Share your learning flexibility with teachers and peers"
          ]
        };
    }
  };

  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Understanding Your Learning Style</h3>
      
      {dominantStyles.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">Complete more questions to see your results!</p>
      ) : dominantStyles.length > 2 ? (
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            You have a <strong className="text-gray-800 dark:text-gray-100">multimodal learning style</strong> with strengths across several categories. This means you're adaptable and can learn effectively through different methods.
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            RayRayRay says: <span className="italic text-violet-700 dark:text-violet-400">"Your brain is like a learning Swiss Army knife – ready for whatever information comes your way. Lucky you!"</span>
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {dominantStyles.map(style => {
            const explanation = getExplanation(style);
            return (
              <div key={style} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{explanation.title}</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{explanation.description}</p>
                
                <div>
                  <h5 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Learning Tips:</h5>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300">
                    {explanation.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/30 dark:to-indigo-900/30 p-5 rounded-xl mt-6 border border-violet-100 dark:border-violet-800">
        <p className="text-violet-900 dark:text-violet-200 font-medium italic">
          "Knowing your learning style is like having the cheat code for your brain. Now you can stop forcing yourself to learn like everyone else and start playing to your strengths!"
        </p>
        <p className="text-right text-violet-600 dark:text-violet-400 text-sm mt-2">— RayRayRay</p>
      </div>
    </div>
  );
};

export default ResultsExplanation;