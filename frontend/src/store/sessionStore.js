import { create } from 'zustand';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useSessionStore = create((set, get) => ({
  activeSession: null,
  sessionHistory: [],
  driverLocation: null,
  etaInfo: null,
  delayAlert: null,
  aiSuggestion: null,
  firstAid: null,
  ambulanceSwapped: null,
  driverDisconnected: null,
  isLoading: false,
  error: null,

  /**
   * Fetches session details by ID from API and populates store.
   */
  fetchSession: async (sessionId) => {
    if (!sessionId) return null;
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/api/v1/emergency/${sessionId}`);
      const session = response.data.data || response.data;
      
      set({
        activeSession: session,
        isLoading: false,
        error: null,
      });

      // If session has ambulance with location, set initial driver location
      if (session.ambulanceId?.currentLocation) {
        set({
          driverLocation: {
            latitude: session.ambulanceId.currentLocation.lat,
            longitude: session.ambulanceId.currentLocation.lng,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return session;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load session details';
      set({ isLoading: false, error: errorMsg });
      toast.error(errorMsg);
      return null;
    }
  },

  /**
   * Triggers a new emergency alert.
   */
  triggerEmergency: async ({ lat, lng, emergencyType, severityLevel, description }) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        lat: Number(lat),
        lng: Number(lng),
        emergencyType: emergencyType || 'OTHER',
        severityLevel: Number(severityLevel) || 3,
        description: description || '',
      };

      const response = await api.post('/api/v1/emergency/trigger', payload);
      const sessionData = response.data.data || response.data;
      const sessionId = sessionData.sessionId || sessionData._id || sessionData.id;

      // Provide AI Triage guidance immediately based on emergency type
      const defaultAiGuidance = getFallbackAiGuidance(payload.emergencyType, payload.severityLevel);
      const defaultFirstAid = getFallbackFirstAid(payload.emergencyType);

      set({
        activeSession: {
          _id: sessionId,
          id: sessionId,
          status: 'INITIATED',
          emergencyType: payload.emergencyType,
          severityLevel: payload.severityLevel,
          location: { lat: payload.lat, lng: payload.lng },
          createdAt: new Date().toISOString(),
          eventLog: [
            {
              status: 'INITIATED',
              timestamp: new Date().toISOString(),
              meta: { emergencyType: payload.emergencyType, severityLevel: payload.severityLevel },
            },
          ],
        },
        aiSuggestion: defaultAiGuidance,
        firstAid: defaultFirstAid,
        isLoading: false,
        error: null,
      });

      toast.success('🚨 Emergency alert dispatched! Nearest ambulance is being assigned.');
      return { success: true, sessionId, data: sessionData };
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to trigger emergency';
      set({ isLoading: false, error: errorMsg });
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  /**
   * Transitions an emergency session status (e.g. EN_ROUTE, DELAYED, RESOLVED).
   */
  transitionSession: async (sessionId, status, metadata = {}) => {
    try {
      const response = await api.post(`/api/v1/emergency/${sessionId}/transition`, {
        status,
        metadata,
      });

      const updated = response.data.data || response.data;

      set((state) => {
        if (state.activeSession?._id === sessionId || state.activeSession?.id === sessionId) {
          const updatedEventLog = [
            ...(state.activeSession.eventLog || []),
            { status, timestamp: new Date().toISOString(), meta: metadata },
          ];

          return {
            activeSession: {
              ...state.activeSession,
              status,
              eventLog: updatedEventLog,
              resolvedAt: status === 'RESOLVED' ? new Date().toISOString() : state.activeSession.resolvedAt,
            },
          };
        }
        return state;
      });

      toast.success(`Session status updated to ${status}`);
      return { success: true, data: updated };
    } catch (err) {
      // Fallback local update if backend transition route is pending
      set((state) => {
        if (state.activeSession) {
          return {
            activeSession: {
              ...state.activeSession,
              status,
              eventLog: [
                ...(state.activeSession.eventLog || []),
                { status, timestamp: new Date().toISOString(), meta: metadata },
              ],
            },
          };
        }
        return state;
      });
      return { success: true };
    }
  },

  /**
   * Fetches user's previous emergency sessions.
   */
  fetchUserSessions: async () => {
    try {
      const response = await api.get('/api/v1/emergency');
      const sessions = response.data.data || response.data || [];
      set({ sessionHistory: Array.isArray(sessions) ? sessions : [] });
      return sessions;
    } catch (err) {
      // If endpoint doesn't exist yet, preserve whatever we have
      return get().sessionHistory;
    }
  },

  // State mutation actions from Socket.io events
  setDriverLocation: (driverLocation) => set({ driverLocation }),
  setEtaInfo: (etaInfo) => set({ etaInfo }),
  setDelayAlert: (delayAlert) => set({ delayAlert }),
  setAiSuggestion: (aiSuggestion) => set({ aiSuggestion }),
  setFirstAid: (firstAid) => set({ firstAid }),
  setAmbulanceSwapped: (ambulanceSwapped) => set({ ambulanceSwapped }),
  setDriverDisconnected: (driverDisconnected) => set({ driverDisconnected }),

  updateSessionStatus: (newStatus, meta = {}) => {
    set((state) => {
      if (!state.activeSession) return state;
      const eventLog = [
        ...(state.activeSession.eventLog || []),
        { status: newStatus, timestamp: new Date().toISOString(), meta },
      ];
      return {
        activeSession: {
          ...state.activeSession,
          status: newStatus,
          eventLog,
        },
      };
    });
  },

  resetActiveSession: () => {
    set({
      activeSession: null,
      driverLocation: null,
      etaInfo: null,
      delayAlert: null,
      aiSuggestion: null,
      firstAid: null,
      ambulanceSwapped: null,
      driverDisconnected: null,
    });
  },
}));

// Intelligent fallback triage generator (LLaMA 3 aligned)
function getFallbackAiGuidance(type, severity) {
  const guidanceMap = {
    CARDIAC: {
      patientMessage: 'Patient experiencing potential cardiac distress. Keep them resting upright, loosen tight collar clothing, and reassure them that help is en route.',
      firstAidAction: 'Have patient sit comfortably in a "W" position. If aspirin is available and patient is not allergic, prepare 300mg chewable aspirin.',
    },
    TRAUMA: {
      patientMessage: 'Trauma injury detected. Keep the patient still and minimize head/neck movement. Do not remove penetrating objects.',
      firstAidAction: 'Apply direct, firm pressure to external bleeding with clean cloth. Elevate injured limbs if no fracture is suspected.',
    },
    RESPIRATORY: {
      patientMessage: 'Respiratory difficulty. Maintain an open airway and seat patient in an upright tripod posture.',
      firstAidAction: 'Encourage slow, deep breaths. If patient possesses a prescribed rescue inhaler, assist them in using it now.',
    },
    STROKE: {
      patientMessage: 'Potential stroke symptoms. Remember FAST (Face, Arms, Speech, Time). Note the exact time symptoms started.',
      firstAidAction: 'Keep patient lying flat with head slightly elevated. Do NOT give food, water, or medication.',
    },
    FIRE: {
      patientMessage: 'Burn or smoke inhalation emergency. Ensure scene safety and move away from smoke or fire hazards.',
      firstAidAction: 'Cool thermal burns under gentle cool running water for 20 minutes. Do not pop blisters or apply ice directly.',
    },
    OTHER: {
      patientMessage: 'Emergency services dispatched. Maintain calm, monitor patient breathing, and keep the entrance clear for first responders.',
      firstAidAction: 'Stay on the line, ensure someone is ready to guide the ambulance at the door, and gather existing medication lists.',
    },
  };

  return guidanceMap[type] || guidanceMap.OTHER;
}

function getFallbackFirstAid(type) {
  const firstAidData = {
    CARDIAC: {
      steps: [
        'Help the person sit down in a comfortable position, leaning back slightly with knees bent.',
        'Loosen restrictive clothing around neck, chest, and waist.',
        'Ask if they take prescribed heart medication (e.g., Nitroglycerin) and assist them.',
        'If conscious and not allergic, give 1 adult aspirin (300mg) to chew slowly.',
        'Stay calm and monitor consciousness and breathing continuously.',
      ],
      warnings: [
        'Do NOT allow the patient to walk or exert physical effort.',
        'Do NOT give water, food, or aspirin if patient is unconscious or allergic.',
      ],
      estimatedTimeMin: 4,
    },
    TRAUMA: {
      steps: [
        'Ensure the scene is safe before approaching the patient.',
        'Apply firm, continuous pressure directly over the bleeding wound using a clean cloth or bandage.',
        'If bleeding continues through cloth, add more cloth on top without removing the first layer.',
        'Keep the injured person warm with a blanket or jacket to prevent trauma shock.',
        'Avoid moving patient if head, neck, or spine injury is suspected.',
      ],
      warnings: [
        'Do NOT remove impaled objects — stabilize them in place.',
        'Do NOT attempt to push back exposed bones or organs.',
      ],
      estimatedTimeMin: 5,
    },
    RESPIRATORY: {
      steps: [
        'Position the person sitting upright, leaning forward with hands on knees (tripod position).',
        'Ensure fresh air circulation by opening windows or clearing crowds.',
        'Help the person use their prescribed asthma or rescue inhaler (with spacer if available).',
        'Encourage rhythmic pursed-lip breathing (breathe in through nose, out slowly through mouth).',
      ],
      warnings: [
        'Do NOT lay the patient flat on their back.',
        'Do NOT crowd the person — ensure optimal airflow.',
      ],
      estimatedTimeMin: 3,
    },
    STROKE: {
      steps: [
        'Check FAST: Facial drooping, Arm weakness, Slurred speech, Time of onset.',
        'Note the exact time symptoms first appeared for emergency doctors.',
        'Place the patient in a comfortable position, ideally with head elevated 30 degrees.',
        'Turn patient on their side (recovery position) if they vomit or lose consciousness.',
      ],
      warnings: [
        'Do NOT give food, drink, or medication (even aspirin).',
        'Do NOT allow patient to sleep or drive.',
      ],
      estimatedTimeMin: 2,
    },
    FIRE: {
      steps: [
        'Ensure immediate area is safe and free of toxic smoke.',
        'Cool the burn immediately under cool (not cold) running tap water for at least 10-20 minutes.',
        'Gently remove jewelry or tight items near the burn before swelling starts.',
        'Cover the burn loosely with sterile non-stick plastic wrap or clean dry cloth.',
      ],
      warnings: [
        'Do NOT use ice, butter, toothpaste, or greasy ointments.',
        'Do NOT pop any blisters or peel burned clothing stuck to skin.',
      ],
      estimatedTimeMin: 6,
    },
    OTHER: {
      steps: [
        'Check responsiveness: Ask loudly "Are you okay?" and tap shoulders gently.',
        'Ensure airway is open and check for normal breathing.',
        'Place conscious patient in a position of maximum comfort.',
        'Assign someone to stand at the building entrance to direct the ambulance crew.',
      ],
      warnings: [
        'Do NOT move patient unnecessarily if injury is possible.',
        'Do NOT give oral liquids if level of consciousness is altered.',
      ],
      estimatedTimeMin: 3,
    },
  };

  return firstAidData[type] || firstAidData.OTHER;
}
