import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface PhlebitisAssessmentProps {
  currentScore: number;
  onScoreChange: (score: number, details: PhlebitisDetails) => void;
  readonly?: boolean;
}

interface PhlebitisDetails {
  pain: boolean;
  redness: boolean;
  swelling: boolean;
  streak: boolean;
  cordPalpable: boolean;
}

const PhlebitisAssessment: React.FC<PhlebitisAssessmentProps> = ({ 
  currentScore, 
  onScoreChange, 
  readonly = false 
}) => {
  const [details, setDetails] = useState<PhlebitisDetails>({
    pain: false,
    redness: false,
    swelling: false,
    streak: false,
    cordPalpable: false
  });

  useEffect(() => {
    // Initialize details based on current score
    const initialDetails = {
      pain: currentScore >= 1,
      redness: currentScore >= 1,
      swelling: currentScore >= 2,
      streak: currentScore >= 3,
      cordPalpable: currentScore >= 4
    };
    setDetails(initialDetails);
  }, [currentScore]);

  const calculateScore = (newDetails: PhlebitisDetails) => {
    let score = 0;
    if (newDetails.pain || newDetails.redness) score = 1;
    if (newDetails.swelling) score = 2;
    if (newDetails.streak) score = 3;
    if (newDetails.cordPalpable) score = 4;
    return score;
  };

  const handleDetailChange = (key: keyof PhlebitisDetails, value: boolean) => {
    if (readonly) return;
    
    const newDetails = { ...details, [key]: value };
    setDetails(newDetails);
    const newScore = calculateScore(newDetails);
    onScoreChange(newScore, newDetails);
  };

  const getScoreColor = (score: number) => {
    if (score === 0) return 'text-green-600 bg-green-50';
    if (score === 1) return 'text-yellow-600 bg-yellow-50';
    if (score === 2) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreDescription = (score: number) => {
    switch (score) {
      case 0: return 'No signs of phlebitis';
      case 1: return 'Possible first signs of phlebitis';
      case 2: return 'Early stage of phlebitis';
      case 3: return 'Medium stage of phlebitis';
      case 4: return 'Advanced stage of phlebitis';
      default: return 'Unknown';
    }
  };

  const getActionRecommendation = (score: number) => {
    switch (score) {
      case 0: return 'Continue routine monitoring';
      case 1: return 'Observe closely, consider early intervention';
      case 2: return 'Consider IV removal and replacement';
      case 3: return 'Remove IV line immediately, consider treatment';
      case 4: return 'Remove IV line immediately, initiate treatment protocol';
      default: return '';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">Phlebitis Assessment</h4>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(currentScore)}`}>
          Score: {currentScore}/4
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-2">{getScoreDescription(currentScore)}</p>
      <p className="text-sm font-medium text-blue-600 mb-4">{getActionRecommendation(currentScore)}</p>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Pain at IV site</p>
            <p className="text-sm text-gray-600">Patient reports discomfort or pain</p>
          </div>
          <button
            onClick={() => handleDetailChange('pain', !details.pain)}
            disabled={readonly}
            className={`p-2 rounded-full transition-colors ${
              details.pain 
                ? 'bg-red-100 text-red-600' 
                : 'bg-gray-200 text-gray-400'
            } ${readonly ? 'cursor-not-allowed' : 'hover:bg-red-200'}`}
          >
            {details.pain ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Redness at IV site</p>
            <p className="text-sm text-gray-600">Visible erythema around insertion site</p>
          </div>
          <button
            onClick={() => handleDetailChange('redness', !details.redness)}
            disabled={readonly}
            className={`p-2 rounded-full transition-colors ${
              details.redness 
                ? 'bg-red-100 text-red-600' 
                : 'bg-gray-200 text-gray-400'
            } ${readonly ? 'cursor-not-allowed' : 'hover:bg-red-200'}`}
          >
            {details.redness ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Swelling</p>
            <p className="text-sm text-gray-600">Visible swelling around IV site</p>
          </div>
          <button
            onClick={() => handleDetailChange('swelling', !details.swelling)}
            disabled={readonly}
            className={`p-2 rounded-full transition-colors ${
              details.swelling 
                ? 'bg-red-100 text-red-600' 
                : 'bg-gray-200 text-gray-400'
            } ${readonly ? 'cursor-not-allowed' : 'hover:bg-red-200'}`}
          >
            {details.swelling ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Red streak</p>
            <p className="text-sm text-gray-600">Red streak along vein pathway</p>
          </div>
          <button
            onClick={() => handleDetailChange('streak', !details.streak)}
            disabled={readonly}
            className={`p-2 rounded-full transition-colors ${
              details.streak 
                ? 'bg-red-100 text-red-600' 
                : 'bg-gray-200 text-gray-400'
            } ${readonly ? 'cursor-not-allowed' : 'hover:bg-red-200'}`}
          >
            {details.streak ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Palpable cord</p>
            <p className="text-sm text-gray-600">Thrombosed vein palpable as cord</p>
          </div>
          <button
            onClick={() => handleDetailChange('cordPalpable', !details.cordPalpable)}
            disabled={readonly}
            className={`p-2 rounded-full transition-colors ${
              details.cordPalpable 
                ? 'bg-red-100 text-red-600' 
                : 'bg-gray-200 text-gray-400'
            } ${readonly ? 'cursor-not-allowed' : 'hover:bg-red-200'}`}
          >
            {details.cordPalpable ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {currentScore >= 2 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-sm font-medium text-yellow-800">
              Action Required: Consider IV line removal and replacement
            </p>
          </div>
        </div>
      )}

      {currentScore >= 3 && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-sm font-medium text-red-800">
              Urgent: Remove IV line immediately and initiate treatment protocol
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhlebitisAssessment;