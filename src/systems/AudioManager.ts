/**
 * 音效管理器
 * 使用Web Audio API生成程序化音效
 */

import Phaser from 'phaser';

/**
 * 音效类型枚举
 */
export enum SoundType {
    // 玩家音效
    PLAYER_ATTACK = 'player_attack',
    PLAYER_HURT = 'player_hurt',
    PLAYER_HEAL = 'player_heal',
    PLAYER_LEVEL_UP = 'player_level_up',
    PLAYER_DIE = 'player_die',
    PLAYER_SHIELD = 'player_shield',
    
    // 技能音效
    SKILL_SLASH = 'skill_slash',
    SKILL_SPIN = 'skill_spin',
    SKILL_LIGHTNING = 'skill_lightning',
    SKILL_LASER = 'skill_laser',
    SKILL_EMP = 'skill_emp',
    SKILL_NOVA = 'skill_nova',
    SKILL_ORB = 'skill_orb',
    SKILL_BOOM = 'skill_boom',
    SKILL_FLAME = 'skill_flame',
    SKILL_ICE = 'skill_ice',
    SKILL_VOID = 'skill_void',
    SKILL_TIME = 'skill_time',
    
    // 敌人音效
    ENEMY_HIT = 'enemy_hit',
    ENEMY_DIE = 'enemy_die',
    
    // 道具音效
    ITEM_PICKUP = 'item_pickup',
    POWERUP_COLLECT = 'powerup_collect',
    
    // UI音效
    UI_CLICK = 'ui_click',
    UI_HOVER = 'ui_hover',
    UI_ERROR = 'ui_error',
    
    // 背景音乐
    BGM_GAME = 'bgm_game',
    BGM_MENU = 'bgm_menu'
}

/**
 * 音效配置接口
 */
interface SoundConfig {
    type: OscillatorType;
    frequency: number;
    duration: number;
    volume: number;
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
    detune?: number;
    harmonics?: number[];
}

/**
 * 音效管理器类
 */
export class AudioManager {
    private scene: Phaser.Scene;
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private musicGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;
    
    private masterVolume: number = 0.7;
    private musicVolume: number = 0.5;
    private sfxVolume: number = 0.8;
    
    private isMuted: boolean = false;
    private currentBGM: OscillatorNode | null = null;
    private bgmInterval: number | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.initAudioContext();
    }

    /**
     * 初始化音频上下文
     */
    private initAudioContext(): void {
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            // 创建主增益节点
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.audioContext.destination);
            
            // 创建音乐增益节点
            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.masterGain);
            
            // 创建音效增益节点
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = this.sfxVolume;
            this.sfxGain.connect(this.masterGain);
            
            console.log('[AudioManager] 音频系统初始化成功');
        } catch (error) {
            console.error('[AudioManager] 音频系统初始化失败:', error);
        }
    }

    /**
     * 确保音频上下文已启动
     */
    private ensureContext(): void {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * 播放音效
     */
    public playSound(type: SoundType): void {
        if (!this.audioContext || !this.sfxGain || this.isMuted) return;
        
        this.ensureContext();
        
        const config = this.getSoundConfig(type);
        if (!config) return;
        
        this.createSound(config, this.sfxGain);
    }

    /**
     * 获取音效配置
     */
    private getSoundConfig(type: SoundType): SoundConfig | null {
        const configs: Record<SoundType, SoundConfig> = {
            // 玩家音效
            [SoundType.PLAYER_ATTACK]: {
                type: 'sawtooth',
                frequency: 220,
                duration: 0.1,
                volume: 0.3,
                attack: 0.01,
                decay: 0.05,
                release: 0.04
            },
            [SoundType.PLAYER_HURT]: {
                type: 'square',
                frequency: 150,
                duration: 0.2,
                volume: 0.4,
                attack: 0.01,
                decay: 0.1,
                release: 0.09
            },
            [SoundType.PLAYER_HEAL]: {
                type: 'sine',
                frequency: 523,
                duration: 0.3,
                volume: 0.25,
                attack: 0.05,
                decay: 0.1,
                release: 0.15,
                harmonics: [1, 1.5, 2]
            },
            [SoundType.PLAYER_LEVEL_UP]: {
                type: 'sine',
                frequency: 440,
                duration: 0.6,
                volume: 0.35,
                attack: 0.05,
                decay: 0.1,
                release: 0.2,
                harmonics: [1, 1.25, 1.5, 2]
            },
            [SoundType.PLAYER_DIE]: {
                type: 'sawtooth',
                frequency: 100,
                duration: 0.8,
                volume: 0.4,
                attack: 0.02,
                decay: 0.3,
                release: 0.48
            },
            [SoundType.PLAYER_SHIELD]: {
                type: 'sine',
                frequency: 800,
                duration: 0.4,
                volume: 0.2,
                attack: 0.1,
                decay: 0.15,
                release: 0.15
            },
            
            // 技能音效
            [SoundType.SKILL_SLASH]: {
                type: 'sawtooth',
                frequency: 300,
                duration: 0.15,
                volume: 0.35,
                attack: 0.01,
                decay: 0.05,
                release: 0.09
            },
            [SoundType.SKILL_SPIN]: {
                type: 'square',
                frequency: 200,
                duration: 0.3,
                volume: 0.3,
                attack: 0.02,
                decay: 0.1,
                release: 0.18
            },
            [SoundType.SKILL_LIGHTNING]: {
                type: 'sawtooth',
                frequency: 600,
                duration: 0.2,
                volume: 0.25,
                attack: 0.01,
                decay: 0.05,
                release: 0.14,
                detune: 50
            },
            [SoundType.SKILL_LASER]: {
                type: 'sawtooth',
                frequency: 400,
                duration: 0.4,
                volume: 0.25,
                attack: 0.05,
                decay: 0.1,
                release: 0.25
            },
            [SoundType.SKILL_EMP]: {
                type: 'square',
                frequency: 80,
                duration: 0.5,
                volume: 0.35,
                attack: 0.01,
                decay: 0.2,
                release: 0.29
            },
            [SoundType.SKILL_NOVA]: {
                type: 'sine',
                frequency: 300,
                duration: 0.4,
                volume: 0.3,
                attack: 0.05,
                decay: 0.15,
                release: 0.2,
                harmonics: [1, 1.5, 2, 2.5]
            },
            [SoundType.SKILL_ORB]: {
                type: 'sine',
                frequency: 500,
                duration: 0.25,
                volume: 0.25,
                attack: 0.02,
                decay: 0.08,
                release: 0.15
            },
            [SoundType.SKILL_BOOM]: {
                type: 'sawtooth',
                frequency: 150,
                duration: 0.35,
                volume: 0.4,
                attack: 0.01,
                decay: 0.15,
                release: 0.19
            },
            [SoundType.SKILL_FLAME]: {
                type: 'sawtooth',
                frequency: 180,
                duration: 0.4,
                volume: 0.3,
                attack: 0.05,
                decay: 0.15,
                release: 0.2
            },
            [SoundType.SKILL_ICE]: {
                type: 'sine',
                frequency: 1200,
                duration: 0.2,
                volume: 0.25,
                attack: 0.01,
                decay: 0.05,
                release: 0.14
            },
            [SoundType.SKILL_VOID]: {
                type: 'sine',
                frequency: 60,
                duration: 0.6,
                volume: 0.35,
                attack: 0.1,
                decay: 0.2,
                release: 0.3
            },
            [SoundType.SKILL_TIME]: {
                type: 'sine',
                frequency: 700,
                duration: 0.5,
                volume: 0.2,
                attack: 0.1,
                decay: 0.15,
                release: 0.25
            },
            
            // 敌人音效
            [SoundType.ENEMY_HIT]: {
                type: 'square',
                frequency: 180,
                duration: 0.08,
                volume: 0.2,
                attack: 0.01,
                decay: 0.03,
                release: 0.04
            },
            [SoundType.ENEMY_DIE]: {
                type: 'sawtooth',
                frequency: 120,
                duration: 0.25,
                volume: 0.25,
                attack: 0.02,
                decay: 0.1,
                release: 0.13
            },
            
            // 道具音效
            [SoundType.ITEM_PICKUP]: {
                type: 'sine',
                frequency: 880,
                duration: 0.15,
                volume: 0.2,
                attack: 0.01,
                decay: 0.05,
                release: 0.09
            },
            [SoundType.POWERUP_COLLECT]: {
                type: 'sine',
                frequency: 660,
                duration: 0.25,
                volume: 0.25,
                attack: 0.02,
                decay: 0.08,
                release: 0.15,
                harmonics: [1, 1.5, 2]
            },
            
            // UI音效
            [SoundType.UI_CLICK]: {
                type: 'sine',
                frequency: 1000,
                duration: 0.08,
                volume: 0.15,
                attack: 0.01,
                decay: 0.03,
                release: 0.04
            },
            [SoundType.UI_HOVER]: {
                type: 'sine',
                frequency: 600,
                duration: 0.05,
                volume: 0.1,
                attack: 0.01,
                decay: 0.02,
                release: 0.02
            },
            [SoundType.UI_ERROR]: {
                type: 'square',
                frequency: 200,
                duration: 0.15,
                volume: 0.2,
                attack: 0.01,
                decay: 0.05,
                release: 0.09
            },
            
            // 背景音乐（占位，实际BGM使用循环播放）
            [SoundType.BGM_GAME]: {
                type: 'sine',
                frequency: 110,
                duration: 2,
                volume: 0.1,
                attack: 0.5,
                decay: 0.5,
                release: 1
            },
            [SoundType.BGM_MENU]: {
                type: 'sine',
                frequency: 220,
                duration: 2,
                volume: 0.1,
                attack: 0.5,
                decay: 0.5,
                release: 1
            }
        };
        
        return configs[type] || null;
    }

    /**
     * 创建音效
     */
    private createSound(config: SoundConfig, gainNode: GainNode): void {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        
        // 如果有泛音，创建多个振荡器
        if (config.harmonics && config.harmonics.length > 0) {
            config.harmonics.forEach((harmonic, index) => {
                const oscillator = this.audioContext!.createOscillator();
                const gain = this.audioContext!.createGain();
                
                oscillator.type = config.type;
                oscillator.frequency.value = config.frequency * harmonic;
                if (config.detune) {
                    oscillator.detune.value = config.detune;
                }
                
                // ADSR包络
                const attack = config.attack || 0.01;
                const decay = config.decay || 0.1;
                const sustain = config.sustain || 0.5;
                const release = config.release || 0.1;
                
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(config.volume / config.harmonics!.length, now + attack);
                gain.gain.linearRampToValueAtTime(config.volume * sustain / config.harmonics!.length, now + attack + decay);
                gain.gain.linearRampToValueAtTime(0, now + config.duration);
                
                oscillator.connect(gain);
                gain.connect(gainNode);
                
                oscillator.start(now);
                oscillator.stop(now + config.duration);
            });
        } else {
            // 单个振荡器
            const oscillator = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            oscillator.type = config.type;
            oscillator.frequency.value = config.frequency;
            if (config.detune) {
                oscillator.detune.value = config.detune;
            }
            
            // ADSR包络
            const attack = config.attack || 0.01;
            const decay = config.decay || 0.1;
            const sustain = config.sustain || 0.5;
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(config.volume, now + attack);
            gain.gain.linearRampToValueAtTime(config.volume * sustain, now + attack + decay);
            gain.gain.linearRampToValueAtTime(0, now + config.duration);
            
            oscillator.connect(gain);
            gain.connect(gainNode);
            
            oscillator.start(now);
            oscillator.stop(now + config.duration);
        }
    }

    /**
     * 播放背景音乐
     */
    public playBGM(type: SoundType.BGM_GAME | SoundType.BGM_MENU = SoundType.BGM_GAME): void {
        if (!this.audioContext || !this.musicGain || this.isMuted) return;
        
        this.ensureContext();
        this.stopBGM();
        
        // 创建简单的程序化背景音乐
        // 使用低频脉冲和和弦创建赛博朋克风格的背景音
        const now = this.audioContext.currentTime;
        
        // 主低音振荡器
        const bassOsc = this.audioContext.createOscillator();
        const bassGain = this.audioContext.createGain();
        const bassFilter = this.audioContext.createBiquadFilter();
        
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.value = type === SoundType.BGM_GAME ? 55 : 82.5; // A1 或 E2
        
        bassFilter.type = 'lowpass';
        bassFilter.frequency.value = 200;
        bassFilter.Q.value = 5;
        
        bassGain.gain.value = 0.15;
        
        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.musicGain);
        
        // 创建LFO调制
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        
        lfo.type = 'sine';
        lfo.frequency.value = 0.5; // 0.5Hz 缓慢调制
        
        lfoGain.gain.value = 10;
        
        lfo.connect(lfoGain);
        lfoGain.connect(bassOsc.frequency);
        
        // 启动
        bassOsc.start(now);
        lfo.start(now);
        
        this.currentBGM = bassOsc;
        
        // 定期添加和弦脉冲
        this.bgmInterval = window.setInterval(() => {
            if (!this.audioContext || !this.musicGain || this.isMuted) return;
            this.playBGMPulse(type);
        }, 2000);
        
        console.log('[AudioManager] 背景音乐开始播放');
    }

    /**
     * 播放背景音乐脉冲
     */
    private playBGMPulse(type: SoundType.BGM_GAME | SoundType.BGM_MENU): void {
        if (!this.audioContext || !this.musicGain) return;
        
        const now = this.audioContext.currentTime;
        
        // 和弦音符
        const chordFrequencies = type === SoundType.BGM_GAME 
            ? [110, 165, 220, 330] // Am和弦
            : [130.8, 164.8, 196, 261.6]; // C和弦
        
        chordFrequencies.forEach((freq, index) => {
            const osc = this.audioContext!.createOscillator();
            const gain = this.audioContext!.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
            
            osc.connect(gain);
            gain.connect(this.musicGain!);
            
            osc.start(now + index * 0.05);
            osc.stop(now + 1.5);
        });
    }

    /**
     * 停止背景音乐
     */
    public stopBGM(): void {
        if (this.currentBGM) {
            try {
                this.currentBGM.stop();
            } catch (e) {
                // 忽略已停止的错误
            }
            this.currentBGM = null;
        }
        
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }

    /**
     * 设置主音量
     */
    public setMasterVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }

    /**
     * 设置音乐音量
     */
    public setMusicVolume(volume: number): void {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        }
    }

    /**
     * 设置音效音量
     */
    public setSFXVolume(volume: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxVolume;
        }
    }

    /**
     * 获取音量设置
     */
    public getVolumes(): { master: number; music: number; sfx: number } {
        return {
            master: this.masterVolume,
            music: this.musicVolume,
            sfx: this.sfxVolume
        };
    }

    /**
     * 静音/取消静音
     */
    public toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
        }
        
        return this.isMuted;
    }

    /**
     * 是否静音
     */
    public getIsMuted(): boolean {
        return this.isMuted;
    }

    /**
     * 暂停所有音频
     */
    public pause(): void {
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
    }

    /**
     * 恢复所有音频
     */
    public resume(): void {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * 清理资源
     */
    public destroy(): void {
        this.stopBGM();
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
    }
}
