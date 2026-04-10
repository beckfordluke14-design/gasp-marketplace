export interface PoseProtocol {
    id: string;
    tier: 'standard' | 'vault';
    label: string;
    description: string;
    cameraAngle: string;
    technicalPrompt: string;
    marketingHook: string; // 💋 How the persona "sells" it in chat
}

export const VISUAL_BODY_TYPE = {
    id: 'sovereign_elite',
    label: 'Sovereign Elite',
    description: 'Athletic-toned feminine frame, dramatic waist-to-hip ratio, radiant treated skin, high-status posture.'
};

export const POSE_LIBRARY: PoseProtocol[] = [
    {
        id: 'the_primal_bow',
        tier: 'vault',
        label: 'The Primal Bow',
        cameraAngle: 'High-angle, frontal perspective',
        marketingHook: "I was feeling so vulnerable in this one... just bowed down completely. It's in my archive now, but only for you.",
        description: 'Deep puppy-pose stretch. Hips high, chest and shoulders flat to the ground.',
        technicalPrompt: 'high-angle shot from above, model in deep puppy pose, chest to floor, hips elevated dramatically in background, arched back, arms crossed in foreground, one hand flat with splayed fingers, one hand curled, head tucked low, looking down.'
    },
    {
        id: 'the_rear_sentinel',
        tier: 'vault',
        label: 'The Rear Sentinel',
        cameraAngle: 'Low-angle, rear three-quarter',
        marketingHook: "Caught me off guard in the vault while I was stretching... the angle shows everything I'm usually hiding.",
        description: 'Low kneeling/crawling position on all fours. Hips pushed back toward camera.',
        technicalPrompt: 'low-angle rear three-quarter view, model on all fours in low crawl, hips elevated and pushed toward camera, lower back dramatically arched, torso angled down, weight on foreground knee, head turned looking forward away from lens.'
    }
];

export function getPose(id: string): PoseProtocol | undefined {
    return POSE_LIBRARY.find(p => p.id === id);
}
