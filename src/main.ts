/**
 * 游戏入口文件
 * 初始化 Phaser 游戏引擎
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from './core/Config';

// 场景导入
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import UIScene from './scenes/UIScene';
import SkillSelectScene from './scenes/SkillSelectScene';

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
            scene: [BootScene, MenuScene, GameScene, UIScene, SkillSelectScene],
            callbacks: {
                preBoot: () => {
                    this.onPreBoot();
                },
                postBoot: () => {
                    this.onPostBoot();
                }
            }
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
