import mitt from 'mitt';

type Events = {
    'force-logout': void; // 定義一個名為 'force-logout' 的事件，它不帶任何參數
};

const eventBus = mitt<Events>();

export default eventBus;