/**
 * 数学工具类
 * 提供常用的数学计算函数
 */

export class MathUtils {
    /**
     * 线性插值
     * @param start 起始值
     * @param end 结束值
     * @param t 插值系数（0-1）
     * @returns 插值结果
     */
    public static lerp(start: number, end: number, t: number): number {
        return start + (end - start) * t;
    }

    /**
     * 钳制数值到指定范围
     * @param value 数值
     * @param min 最小值
     * @param max 最大值
     * @returns 钳制后的数值
     */
    public static clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * 将数值映射到新范围
     * @param value 数值
     * @param inMin 输入范围最小值
     * @param inMax 输入范围最大值
     * @param outMin 输出范围最小值
     * @param outMax 输出范围最大值
     * @returns 映射后的数值
     */
    public static mapRange(
        value: number,
        inMin: number,
        inMax: number,
        outMin: number,
        outMax: number
    ): number {
        return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
    }

    /**
     * 检查数值是否在范围内
     * @param value 数值
     * @param min 最小值
     * @param max 最大值
     * @returns 是否在范围内
     */
    public static inRange(value: number, min: number, max: number): boolean {
        return value >= min && value <= max;
    }

    /**
     * 将角度规范化到0-360度范围
     * @param angle 角度（度）
     * @returns 规范化后的角度
     */
    public static normalizeAngle(angle: number): number {
        while (angle < 0) angle += 360;
        while (angle >= 360) angle -= 360;
        return angle;
    }

    /**
     * 将角度从度转换为弧度
     * @param degrees 角度（度）
     * @returns 弧度
     */
    public static degreesToRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * 将角度从弧度转换为度
     * @param radians 弧度
     * @returns 角度（度）
     */
    public static radiansToDegrees(radians: number): number {
        return radians * (180 / Math.PI);
    }

    /**
     * 计算两点之间的距离平方（避免开方运算，性能更高）
     * @param x1 点1的x坐标
     * @param y1 点1的y坐标
     * @param x2 点2的x坐标
     * @param y2 点2的y坐标
     * @returns 距离平方
     */
    public static distanceSquared(
        x1: number,
        y1: number,
        x2: number,
        y2: number
    ): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    }

    /**
     * 检查点是否在矩形内
     * @param x 点的x坐标
     * @param y 点的y坐标
     * @param rectX 矩形的x坐标
     * @param rectY 矩形的y坐标
     * @param rectWidth 矩形宽度
     * @param rectHeight 矩形高度
     * @returns 是否在矩形内
     */
    public static pointInRect(
        x: number,
        y: number,
        rectX: number,
        rectY: number,
        rectWidth: number,
        rectHeight: number
    ): boolean {
        return (
            x >= rectX &&
            x <= rectX + rectWidth &&
            y >= rectY &&
            y <= rectY + rectHeight
        );
    }

    /**
     * 检查点是否在圆形内
     * @param x 点的x坐标
     * @param y 点的y坐标
     * @param circleX 圆心的x坐标
     * @param circleY 圆心的y坐标
     * @param radius 圆的半径
     * @returns 是否在圆形内
     */
    public static pointInCircle(
        x: number,
        y: number,
        circleX: number,
        circleY: number,
        radius: number
    ): boolean {
        const dx = x - circleX;
        const dy = y - circleY;
        return dx * dx + dy * dy <= radius * radius;
    }

    /**
     * 检查两个矩形是否相交
     * @param x1 矩形1的x坐标
     * @param y1 矩形1的y坐标
     * @param w1 矩形1的宽度
     * @param h1 矩形1的高度
     * @param x2 矩形2的x坐标
     * @param y2 矩形2的y坐标
     * @param w2 矩形2的宽度
     * @param h2 矩形2的高度
     * @returns 是否相交
     */
    public static rectIntersect(
        x1: number,
        y1: number,
        w1: number,
        h1: number,
        x2: number,
        y2: number,
        w2: number,
        h2: number
    ): boolean {
        return (
            x1 < x2 + w2 &&
            x1 + w1 > x2 &&
            y1 < y2 + h2 &&
            y1 + h1 > y2
        );
    }

    /**
     * 检查两个圆是否相交
     * @param x1 圆1的x坐标
     * @param y1 圆1的y坐标
     * @param r1 圆1的半径
     * @param x2 圆2的x坐标
     * @param y2 圆2的y坐标
     * @param r2 圆2的半径
     * @returns 是否相交
     */
    public static circleIntersect(
        x1: number,
        y1: number,
        r1: number,
        x2: number,
        y2: number,
        r2: number
    ): boolean {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy <= (r1 + r2) * (r1 + r2);
    }

    /**
     * 缓动函数：EaseOutQuad
     * @param t 进度（0-1）
     * @returns 缓动后的值
     */
    public static easeOutQuad(t: number): number {
        return t * (2 - t);
    }

    /**
     * 缓动函数：EaseInQuad
     * @param t 进度（0-1）
     * @returns 缓动后的值
     */
    public static easeInQuad(t: number): number {
        return t * t;
    }

    /**
     * 缓动函数：EaseInOutQuad
     * @param t 进度（0-1）
     * @returns 缓动后的值
     */
    public static easeInOutQuad(t: number): number {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    /**
     * 生成随机整数
     * @param min 最小值
     * @param max 最大值
     * @returns 随机整数
     */
    public static randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * 生成随机浮点数
     * @param min 最小值
     * @param max 最大值
     * @returns 随机浮点数
     */
    public static randomFloat(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    /**
     * 检查概率是否触发
     * @param chance 概率（0-1）
     * @returns 是否触发
     */
    public static checkChance(chance: number): boolean {
        return Math.random() < chance;
    }

    /**
     * 计算百分比
     * @param value 数值
     * @param total 总数
     * @returns 百分比（0-100）
     */
    public static calculatePercentage(value: number, total: number): number {
        return total === 0 ? 0 : (value / total) * 100;
    }
}

/**
 * 向量工具类
 */
export class VectorUtils {
    /**
     * 计算两个向量的点积
     * @param x1 向量1的x分量
     * @param y1 向量1的y分量
     * @param x2 向量2的x分量
     * @param y2 向量2的y分量
     * @returns 点积
     */
    public static dot(x1: number, y1: number, x2: number, y2: number): number {
        return x1 * x2 + y1 * y2;
    }

    /**
     * 计算两个向量的叉积
     * @param x1 向量1的x分量
     * @param y1 向量1的y分量
     * @param x2 向量2的x分量
     * @param y2 向量2的y分量
     * @returns 叉积
     */
    public static cross(x1: number, y1: number, x2: number, y2: number): number {
        return x1 * y2 - y1 * x2;
    }

    /**
     * 计算向量的长度
     * @param x 向量的x分量
     * @param y 向量的y分量
     * @returns 向量长度
     */
    public static length(x: number, y: number): number {
        return Math.sqrt(x * x + y * y);
    }

    /**
     * 归一化向量
     * @param x 向量的x分量
     * @param y 向量的y分量
     * @returns 归一化后的向量 {x, y}
     */
    public static normalize(x: number, y: number): { x: number; y: number } {
        const len = this.length(x, y);
        if (len === 0) return { x: 0, y: 0 };
        return { x: x / len, y: y / len };
    }

    /**
     * 计算两个向量之间的夹角
     * @param x1 向量1的x分量
     * @param y1 向量1的y分量
     * @param x2 向量2的x分量
     * @param y2 向量2的y分量
     * @returns 夹角（弧度）
     */
    public static angleBetween(x1: number, y1: number, x2: number, y2: number): number {
        const dot = this.dot(x1, y1, x2, y2);
        const len1 = this.length(x1, y1);
        const len2 = this.length(x2, y2);
        return Math.acos(dot / (len1 * len2));
    }
}
