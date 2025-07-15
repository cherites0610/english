import { createMemoryHistory, createRouter } from 'vue-router'

import Talk from '@/views/Talk.vue'
import AchievementManagement from '@/views/AchievementManagement.vue'
import QuestManagement from '@/views/QuestManagement.vue'
import FurnitureTemplateManagement from '@/views/FurnitureTemplateManagement.vue'
import NpcManagement from '@/views/NpcManagement.vue'
import BattleManagement from '@/views/BattleManagement.vue'
import TalkTest from '@/views/TalkTest.vue'

const routes = [
    { path: '/', component: Talk },
    { path: '/achievement', component: AchievementManagement },
    { path: '/quest', component: QuestManagement },
    { path: '/furniture-template', component: FurnitureTemplateManagement },
    { path: '/npc', component: NpcManagement },
    { path: '/battle', component: BattleManagement },
    { path: '/talk-test', component: TalkTest }
]

export const router = createRouter({
    history: createMemoryHistory(),
    routes,
})