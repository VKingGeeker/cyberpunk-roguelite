/**
 * 启动场景
 * 负责加载游戏资源和初始化
 */

import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    /**
     * 预加载资源
     */
    preload(): void {
        // 创建加载进度条
        this.createLoadingBar();

        // 加载玩家资源
        this.load.image('player_idle', 'assets/images/player_idle.png');
        this.load.image('player_run', 'assets/images/player_run.png');
        this.load.image('player_attack', 'assets/images/player_attack.png');

        // 加载敌人资源
        this.load.image('enemy_common_idle', 'assets/images/enemy_common_idle.png');
        this.load.image('enemy_common_attack', 'assets/images/enemy_common_attack.png');
        this.load.image('enemy_elite_idle', 'assets/images/enemy_elite_idle.png');
        this.load.image('enemy_elite_attack', 'assets/images/enemy_elite_attack.png');
        this.load.image('enemy_boss_idle', 'assets/images/enemy_boss_idle.png');
        this.load.image('enemy_boss_attack', 'assets/images/enemy_boss_attack.png');

        // 加载地图资源
        this.load.image('tile_floor', 'assets/images/tile_floor.png');
        this.load.image('tile_wall', 'assets/images/tile_wall.png');

        // 加载物品图标
        this.load.image('icon_vibroblade', 'assets/images/icons/vibroblade.png');
        this.load.image('icon_heatkatana', 'assets/images/icons/heatkatana.png');
        this.load.image('icon_highfreqblade', 'assets/images/icons/highfreqblade.png');
        this.load.image('icon_thunderaxe', 'assets/images/icons/thunderaxe.png');
        this.load.image('icon_jacket', 'assets/images/icons/jacket.png');
        this.load.image('icon_kevlar', 'assets/images/icons/kevlar.png');
        this.load.image('icon_nanobot', 'assets/images/icons/nanobot.png');
        this.load.image('icon_battery', 'assets/images/icons/battery.png');
        this.load.image('icon_teleport', 'assets/images/icons/teleport.png');
        this.load.image('icon_shield', 'assets/images/icons/shield.png');

        // 加载技能图标
        this.load.image('icon_slash', 'assets/images/icons/slash.png');
        this.load.image('icon_spin', 'assets/images/icons/spin.png');
        this.load.image('icon_dash', 'assets/images/icons/dash.png');
        this.load.image('icon_heal', 'assets/images/icons/heal.png');

        // 加载音效（可选）
        // this.load.audio('bgm', 'assets/audio/bgm.mp3');
        // this.load.audio('attack', 'assets/audio/attack.wav');
        // this.load.audio('hit', 'assets/audio/hit.wav');
    }

    /**
     * 创建加载进度条
     */
    private createLoadingBar(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 创建进度条背景
        const barBg = this.add.graphics();
        barBg.fillStyle(0x1a1a2e, 1);
        barBg.fillRect(width / 2 - 200, height / 2 + 50, 400, 20);

        // 创建进度条
        const bar = this.add.graphics();
        bar.fillStyle(0x00ffff, 1);
        bar.fillRect(width / 2 - 198, height / 2 + 52, 0, 16);

        // 监听加载进度
        this.load.on('progress', (value: number) => {
            bar.clear();
            bar.fillStyle(0x00ffff, 1);
            bar.fillRect(width / 2 - 198, height / 2 + 52, 396 * value, 16);
        });
    }

    /**
     * 创建完成后执行
     */
    create(): void {
        // 初始化游戏数据
        this.initializeGameData();

        // 切换到主菜单场景
        this.scene.start('MenuScene');
    }

    /**
     * 初始化游戏数据
     */
    private initializeGameData(): void {
        // 这里可以初始化全局游戏数据
        // 比如从本地存储加载存档
    }
}
