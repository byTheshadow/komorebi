export const pushManager = {
  // 检查是否支持通知
  isSupported() {
    return 'Notification' in window;
  },

  // 获取当前权限状态: 'default' | 'granted' | 'denied'
  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  // 申请浏览器通知权限
  async requestPermission() {
    if (!this.isSupported()) {
      return { success: false, reason: '浏览器不支持系统通知' };
    }
    const permission = await Notification.requestPermission();
    return {
      success: permission === 'granted',
      status: permission
    };
  },

  // 发送即时测试通知
  sendLocalNotice(title, body) {
    if (this.getPermission() !== 'granted') return false;
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
      return true;
    } catch (e) {
      console.warn('通知触发失败:', e);
      return false;
    }
  }
};
