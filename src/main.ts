/**
 * 游戏入口文件
 * 初始化 Phaser 游戏引擎
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from './core/Config';

// 场景导入
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import ClassSelectScene from './scenes/ClassSelectScene';
import GameScene from './scenes/GameScene';
import UIScene from './scenes/UIScene';
import SkillSelectScene from './scenes/SkillSelectScene';
import SkillTreeScene from './scenes/SkillTreeScene';
import CraftingScene from './scenes/CraftingScene';
import SaveScene from './scenes/SaveScene';
import TimeRewindScene from './scenes/TimeRewindScene';
import PauseScene from './scenes/PauseScene';
import EventScene from './scenes/EventScene';
import LobbyScene from './scenes/LobbyScene';
// 测试场景（仅开发环境）
import TestMenuScene from './scenes/TestMenuScene';

/**
 * 游戏主类
 */
class CyberpunkRogueliteGame {
    private game: Phaser.Game;
    private loadingScreen: HTMLElement;

    constructor() {
        this.loadingScreen = document.getElementById('loading-screen')!;
        this.initGame();
    }

    /**
     * 初始化游戏
     */
    private initGame(): void {
        // 基础场景列表
        const scenes: any[] = [BootScene, MenuScene, ClassSelectScene, GameScene, UIScene, SkillSelectScene, SkillTreeScene, CraftingScene, SaveScene, TimeRewindScene, PauseScene, EventScene, LobbyScene];
        
        // 仅在开发环境添加测试场景
        if (import.meta.env.DEV) {
            scenes.push(TestMenuScene);
        }
        
        this.game = new Phaser.Game({
            type: Phaser.AUTO,
            width: GAME_CONFIG.width,
            height: GAME_CONFIG.height,
            parent: 'game-container',
            backgroundColor: '#0a0a0a',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: false
                }
            },
            scene: scenes,
            callbacks: {
                preBoot: () => {
                    this.onPreBoot();
                },
                postBoot: () => {
                    this.onPostBoot();
                }
            },
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: GAME_CONFIG.width,
                height: GAME_CONFIG.height,
                // 关键：确保全屏时保持清晰度
                resizeInterval: 100,
                // 缩放策略：保持像素清晰 (1 = 不缩放)
                zoom: 1
            },
            render: {
                // 优化渲染清晰度
                antialias: true,
                antialiasGL: true,
                pixelArt: false,
                roundPixels: false,
                powerPreference: 'high-performance'
            },
            dom: {
                createContainer: true
            }
        });
        
        // 监听窗口大小变化，动态调整游戏尺寸
        window.addEventListener('resize', () => {
            // 使用 resize 方法让 Phaser 自动处理缩放
            this.game.scale.resize(window.innerWidth, window.innerHeight);
        });
    }

    /**
     * 游戏启动前回调
     */
    private onPreBoot(): void {
        console.log('Cyberpunk Roguelite - Initializing...');
    }

    /**
     * 游戏启动后回调
     */
    private onPostBoot(): void {
        console.log('Cyberpunk Roguelite - Ready!');

        // 隐藏加载界面
        setTimeout(() => {
            if (this.loadingScreen) {
                this.loadingScreen.style.opacity = '0';
                this.loadingScreen.style.transition = 'opacity 0.5s ease-out';
                setTimeout(() => {
                    this.loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 1000);
    }
}

// 启动游戏
new CyberpunkRogueliteGame();
