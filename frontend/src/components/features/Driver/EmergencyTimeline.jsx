import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { CheckCircle, Circle, MapPin, Navigation, UserCheck, Hospital, Flag } from 'lucide-react';
import { useState } from 'react';

export default function EmergencyTimeline() {
  // Local state for demo progression
  const [currentStep, setCurrentStep] = useState(2); // 0: Received, 1: Assigned, 2: En Route (default for demo)

  const steps = [
    { label: 'Emergency Received', icon: Flag },
    { label: 'Driver Assigned', icon: UserCheck },
    { label: 'En Route to Patient', icon: Navigation, action: 'Start Trip' },
    { label: 'Arrived at Patient', icon: MapPin, action: 'Arrived at Patient' },
    { label: 'Patient Picked Up', icon: UserCheck, action: 'Patient Picked Up' },
    { label: 'Reached Hospital', icon: Hospital, action: 'Reached Hospital' },
    { label: 'Emergency Completed', icon: CheckCircle, action: 'Complete Emergency' },
  ];

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <Card className="mb-6 border-border-primary/50">
      <div className="p-4 border-b border-border-primary/30">
        <h3 className="font-bold">Emergency Progress</h3>
      </div>
      <div className="p-5">
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const Icon = step.icon;

            return (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                    ${isCompleted ? 'bg-green-500/20 border-green-500 text-green-500' : 
                      isCurrent ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 
                      'bg-bg-secondary border-border-primary text-text-muted'}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-0.5 h-full my-1 ${isCompleted ? 'bg-green-500/50' : 'bg-border-primary'}`} />
                  )}
                </div>
                <div className={`flex-1 pb-4 ${isCurrent ? 'pt-1' : 'pt-1.5'}`}>
                  <p className={`font-medium ${isCompleted ? 'text-text-muted line-through' : isCurrent ? 'text-text-primary' : 'text-text-muted'}`}>
                    {step.label}
                  </p>
                  
                  {isCurrent && step.action && (
                    <Button 
                      className="mt-3 w-full" 
                      variant="primary" 
                      size="sm"
                      onClick={handleNextStep}
                    >
                      {step.action}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
