import React, { useState } from 'react';
import { X, ExternalLink, ShieldAlert, BadgeCheck, UploadCloud, Users, ChevronRight, ChevronLeft, Globe, Key, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SetupGuideModalProps {
    onClose: () => void;
}

interface TutorialStep {
    title: string;
    description: string;
    icon: React.ReactNode;
    image?: string;
    details: string[];
    tip?: string;
    tipIcon?: React.ReactNode;
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        title: "Create Google Cloud Project",
        description: "Everything starts with a project to house your credentials.",
        icon: <UploadCloud className="text-indigo-400" />,
        image: "/images/tutorial/step1-create-project.jpg",
        details: [
            "Go to the Google Cloud Console.",
            "Click on the 'Select a project' dropdown (top left).",
            "Click 'New Project' and name it 'Execution Board'."
        ]
    },
    {
        title: "Enable Google Drive API",
        description: "Grant the project permission to interact with your files.",
        icon: <Globe className="text-emerald-400" />,
        image: "/images/tutorial/step2-enable-api.JPG",
        details: [
            "Search for 'Google Drive API' in the search bar/library.",
            "Click 'Enable' to activate it for your project."
        ]
    },
    {
        title: "Configure OAuth Consent",
        description: "Define how users (you) will interact with the app.",
        icon: <Settings className="text-blue-400" />,
        image: "/images/tutorial/step3-oauth-consent.JPG",
        details: [
            "Go to 'Google Auth Platform' > 'Overview' > 'Create Branding'.",
            "Select 'External' user type.",
            "Fill in required info like App name and support email."
        ]
    },
    {
        title: "Create Credentials",
        description: "Generate the actual ID used for authentication.",
        icon: <Key className="text-purple-400" />,
        image: "/images/tutorial/step4-credentials.JPG",
        details: [
            "Go to 'Google Auth Platform' > 'Clients' > 'Create Client'.",
            "Choose 'Web application' as the Application type."
        ]
    },
    {
        title: "Origins & Redirects",
        description: "Security rules to ensure only your app uses the ID.",
        icon: <ShieldAlert className="text-red-400" />,
        image: "/images/tutorial/step5-origins-redirects.JPG",
        details: [
            "Add 'http://localhost:3000' to 'Authorized JavaScript origins'.",
            "Add 'http://localhost:3000' to 'Authorized redirect URIs'."
        ],
        tip: "If deploying to Vercel, add your production URL here too!",
        tipIcon: <Globe size={16} />
    },
    {
        title: "Add Test Users",
        description: "While in 'Testing' mode, only specific users can login.",
        icon: <Users className="text-orange-400" />,
        image: "/images/tutorial/step6-test-users.JPG",
        details: [
            "Go back to 'Google Auth Platform' > 'Audience' tab.",
            "Scroll down to 'Test users'.",
            "Click 'Add Users' and enter your Gmail address.",
            "Save and continue."
        ],
        tip: "Missing this step will cause 'Access Blocked' errors!",
        tipIcon: <ShieldAlert size={16} />
    },
    {
        title: "Save Your Client ID",
        description: "The final piece of the puzzle.",
        icon: <BadgeCheck className="text-indigo-400" />,
        image: "/images/tutorial/step7-client-id.JPG",
        details: [
            "Click 'Create' to finish.",
            "Copy the 'Client ID' string.",
            "Paste it into the setup screen in this app."
        ]
    }
];

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isImageExpanded, setIsImageExpanded] = useState(false);

    const step = TUTORIAL_STEPS[currentStep];

    const paginate = (newDirection: number) => {
        if (currentStep + newDirection >= 0 && currentStep + newDirection < TUTORIAL_STEPS.length) {
            setDirection(newDirection);
            setCurrentStep(currentStep + newDirection);
        }
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 300 : -300,
            opacity: 0
        })
    };

    return (
        <>
            {/* Main Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
                <div className="w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col md:flex-row my-auto overflow-hidden">

                    {/* Visual/Image Section */}
                    <div className="w-full md:w-3/5 bg-zinc-900 flex items-center justify-center relative group overflow-hidden border-b md:border-b-0 md:border-r border-zinc-800 min-h-[250px] sm:min-h-[350px] md:min-h-[650px]">
                        <AnimatePresence initial={false} custom={direction}>
                            <motion.div
                                key={currentStep}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 }
                                }}
                                className="absolute inset-0 flex items-center justify-center p-3 sm:p-4 md:p-8"
                            >
                                <div
                                    className="w-full h-full relative rounded-xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950/50 cursor-pointer group/image"
                                    onClick={() => step.image && setIsImageExpanded(true)}
                                >
                                    {step.image ? (
                                        <>
                                            <img
                                                src={step.image}
                                                alt={step.title}
                                                className="w-full h-full object-contain transition-transform group-hover/image:scale-105"
                                                onError={(e) => {
                                                    // Handle cases where extension might be mismatched
                                                    const target = e.target as HTMLImageElement;
                                                    if (target.src.endsWith('.JPG')) {
                                                        target.src = target.src.replace('.JPG', '.jpg');
                                                    } else if (target.src.endsWith('.jpg')) {
                                                        target.src = target.src.replace('.jpg', '.JPG');
                                                    }
                                                }}
                                            />
                                            {/* Click to expand hint */}
                                            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center">
                                                <div className="opacity-0 group-hover/image:opacity-100 transition-opacity bg-black/80 px-4 py-2 rounded-lg text-white text-sm font-medium">
                                                    Click to expand
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-4">
                                            <UploadCloud size={48} className="opacity-20" />
                                            <p className="text-xs uppercase tracking-widest font-mono">No Image Available</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Content Section */}
                    <div className="w-full md:w-2/5 flex flex-col bg-zinc-950 relative max-h-[calc(100vh-1rem)] md:max-h-[650px]">
                        {/* Header */}
                        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex items-center justify-between border-b border-zinc-900 shrink-0">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs sm:text-sm font-bold border border-indigo-500/30">
                                    {currentStep + 1}
                                </div>
                                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Step {currentStep + 1} of {TUTORIAL_STEPS.length}</span>
                            </div>
                            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Step Info - Scrollable */}
                        <div className="flex-1 px-4 sm:px-6 md:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-y-auto">
                            <div className="space-y-2">
                                <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                                    {step.title}
                                </h3>
                                <p className="text-zinc-400 text-sm">
                                    {step.description}
                                </p>
                            </div>

                            <div className="space-y-3">
                                {step.details.map((detail, idx) => (
                                    <div key={idx} className="flex gap-3 text-sm text-zinc-300">
                                        <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500/40 mt-1.5" />
                                        <p dangerouslySetInnerHTML={{ __html: detail.replace(/'([^']*)'/g, '<strong>$1</strong>') }} />
                                    </div>
                                ))}
                            </div>

                            {step.tip && (
                                <div className="p-3 sm:p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex gap-3 text-amber-200/80 text-xs">
                                    <div className="shrink-0 text-amber-500">
                                        {step.tipIcon || <ShieldAlert size={16} />}
                                    </div>
                                    <span>{step.tip}</span>
                                </div>
                            )}
                        </div>

                        {/* Navigation */}
                        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-t border-zinc-900 bg-zinc-950 flex items-center gap-2 sm:gap-3 shrink-0">
                            {currentStep > 0 && (
                                <button
                                    onClick={() => paginate(-1)}
                                    className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl transition-all border border-zinc-800 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
                                >
                                    <ChevronLeft size={18} />
                                    <span className="hidden sm:inline">Back</span>
                                </button>
                            )}

                            {currentStep < TUTORIAL_STEPS.length - 1 ? (
                                <button
                                    onClick={() => paginate(1)}
                                    className="flex-[2] py-2.5 sm:py-3 px-3 sm:px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
                                >
                                    Next Step
                                    <ChevronRight size={18} />
                                </button>
                            ) : (
                                <button
                                    onClick={onClose}
                                    className="flex-[2] py-2.5 sm:py-3 px-3 sm:px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
                                >
                                    <BadgeCheck size={18} />
                                    I'm Ready!
                                </button>
                            )}
                        </div>

                        {/* Progress Bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900">
                            <motion.div
                                className="h-full bg-indigo-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Lightbox Modal */}
            <AnimatePresence>
                {isImageExpanded && step.image && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-lg flex items-center justify-center p-4"
                        onClick={() => setIsImageExpanded(false)}
                    >
                        <button
                            onClick={() => setIsImageExpanded(false)}
                            className="absolute top-4 right-4 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
                        >
                            <X size={24} />
                        </button>
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={step.image}
                                alt={step.title}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (target.src.endsWith('.JPG')) {
                                        target.src = target.src.replace('.JPG', '.jpg');
                                    } else if (target.src.endsWith('.jpg')) {
                                        target.src = target.src.replace('.jpg', '.JPG');
                                    }
                                }}
                            />
                        </motion.div>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                            Click anywhere to close
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
