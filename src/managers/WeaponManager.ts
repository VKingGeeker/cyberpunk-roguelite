/**
 * 武器管理器
 * 处理武器的装备、切换和属性应用
 */

import { Weapon } from '../core/Types';
import { getStarterWeapon, getWeaponById, getRandomWeapon } from '../data/Weapons';
import { GAME_CONFIG } from '../core/Config';
import Phaser from 'phaser';

export class WeaponManager {
    private scene: Phaser.Scene;
    private currentWeapon: Weapon;
    private ownedWeapons: Weapon[] = [];
    private weaponSlots: (Weapon | null)[] = [null, null, null]; // 最多3个武器槽位
    private activeWeaponSlot: number = 0;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.currentWeapon = getStarterWeapon();
        this.ownedWeapons.push(this.currentWeapon);
        this.weaponSlots[0] = this.currentWeapon;
    }

    /**
     * 装备武器
     */
    public equipWeapon(weapon: Weapon, slotIndex?: number): void {
        const slot = slotIndex !== undefined ? slotIndex : this.findEmptyWeaponSlot();
        
        if (slot === -1) {
            // 没有空槽位，替换当前武器
            this.weaponSlots[this.activeWeaponSlot] = weapon;
        } else {
            this.weaponSlots[slot] = weapon;
        }

        if (!this.ownedWeapons.find(w => w.id === weapon.id)) {
            this.ownedWeapons.push(weapon);
        }

        // 如果是第一次装备武器，立即应用
        if (!this.currentWeapon || slot === this.activeWeaponSlot) {
            this.currentWeapon = weapon;
        }
    }

    /**
     * 查找空武器槽
     */
    private findEmptyWeaponSlot(): number {
        for (let i = 0; i < this.weaponSlots.length; i++) {
            if (this.weaponSlots[i] === null) return i;
        }
        return -1;
    }

    /**
     * 切换武器（按槽位）
     */
    public switchWeapon(slotIndex: number): void {
        if (slotIndex < 0 || slotIndex >= this.weaponSlots.length) return;
        if (!this.weaponSlots[slotIndex]) return;

        this.activeWeaponSlot = slotIndex;
        this.currentWeapon = this.weaponSlots[slotIndex]!;
    }

    /**
     * 切换到下一个武器
     */
    public switchToNextWeapon(): void {
        let nextSlot = (this.activeWeaponSlot + 1) % this.weaponSlots.length;
        let attempts = 0;

        while (!this.weaponSlots[nextSlot] && attempts < this.weaponSlots.length) {
            nextSlot = (nextSlot + 1) % this.weaponSlots.length;
            attempts++;
        }

        if (this.weaponSlots[nextSlot]) {
            this.switchWeapon(nextSlot);
        }
    }

    /**
     * 应用武器属性到玩家属性
     */
    public applyWeaponStats(baseStats: any): void {
        if (!this.currentWeapon) return;

        // 基础属性 + 武器属性
        baseStats.attack = GAME_CONFIG.player.baseAttack + this.currentWeapon.attack;
        baseStats.attackSpeed = this.currentWeapon.attackSpeed;
        baseStats.critRate = GAME_CONFIG.player.baseCritRate + this.currentWeapon.critRate;
        baseStats.critDamage = GAME_CONFIG.player.baseCritDamage + this.currentWeapon.critDamage;
    }

    /**
     * 获取当前武器
     */
    public getCurrentWeapon(): Weapon {
        return this.currentWeapon;
    }

    /**
     * 获取所有武器槽位
     */
    public getWeaponSlots(): (Weapon | null)[] {
        return this.weaponSlots;
    }

    /**
     * 获取已拥有武器列表
     */
    public getOwnedWeapons(): Weapon[] {
        return this.ownedWeapons;
    }

    /**
     * 获取当前武器槽位
     */
    public getActiveWeaponSlot(): number {
        return this.activeWeaponSlot;
    }

    /**
     * 随机获得武器（用于掉落）
     */
    public grantRandomWeapon(): Weapon {
        const weapon = getRandomWeapon();
        this.equipWeapon(weapon);
        return weapon;
    }

    /**
     * 显示武器装备特效
     */
    public showWeaponEquipEffect(weapon: Weapon, playerX: number, playerY: number): void {
        const rarityColors: Record<string, number> = {
            'common': 0x888888,
            'rare': 0x4488ff,
            'epic': 0xaa44ff,
            'legendary': 0xffaa00
        };

        const color = rarityColors[weapon.rarity] || 0xffffff;
        
        const text = this.scene.add.text(playerX, playerY - 50, `装备: ${weapon.name}`, {
            fontSize: '20px',
            fontStyle: 'bold',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        text.setDepth(200);

        this.scene.tweens.add({
            targets: text,
            y: playerY - 90,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });

        // 武器光环
        const ring = this.scene.add.graphics();
        ring.lineStyle(3, color, 0.8);
        ring.strokeCircle(playerX, playerY, 30);

        this.scene.tweens.add({
            targets: ring,
            scale: 2,
            alpha: 0,
            duration: 600,
            onComplete: () => ring.destroy()
        });
    }

    /**
     * 显示武器切换特效
     */
    public showWeaponSwitchEffect(playerX: number, playerY: number): void {
        const flash = this.scene.add.graphics();
        flash.fillStyle(0xffffff, 0.3);
        flash.fillRect(playerX - 20, playerY - 20, 40, 40);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });
    }

    /**
     * 获取存档数据
     */
    public getSaveData(): any {
        return {
            currentWeaponId: this.currentWeapon.id,
            weaponSlots: this.weaponSlots.map(slot => slot?.id),
            activeWeaponSlot: this.activeWeaponSlot,
            ownedWeapons: this.ownedWeapons.map(weapon => weapon.id)
        };
    }

    /**
     * 加载存档数据
     */
    public loadSaveData(data: any): void {
        // 实现加载逻辑
    }
}