<template>
    <div class="page-container">
        <h1>對戰管理系統</h1>
        <el-row :gutter="20">
            <el-col :span="6">
                <el-card class="box-card">
                    <template #header>
                        <div class="card-header">
                            <span>父對戰類型</span>
                            <el-button type="primary" :icon="Plus" circle @click="openDialog('create', 'parent')" />
                        </div>
                    </template>
                    <el-menu :default-active="selectedParent?.id" @select="handleParentSelect">
                        <el-menu-item v-for="p in parentCategories" :key="p.id" :index="p.id">
                            <span class="menu-item-text">{{ p.name }}</span>
                            <div>
                                <el-button link :icon="Edit" @click.stop="openDialog('edit', 'parent', p)" />
                                <el-button link :icon="Delete" type="danger"
                                    @click.stop="handleDelete('parent', p.id)" />
                            </div>
                        </el-menu-item>
                    </el-menu>
                </el-card>
            </el-col>

            <el-col :span="6">
                <el-card class="box-card">
                    <template #header>
                        <div class="card-header">
                            <span>子對戰類型</span>
                            <el-button type="primary" :icon="Plus" circle :disabled="!selectedParent"
                                @click="openDialog('create', 'child')" />
                        </div>
                    </template>
                    <el-menu v-if="selectedParent" :default-active="selectedChild?.id" @select="handleChildSelect">
                        <el-menu-item v-for="c in filteredChildCategories" :key="c.id" :index="c.id">
                            <span class="menu-item-text">{{ c.name }}</span>
                            <div>
                                <el-button link :icon="Edit" @click.stop="openDialog('edit', 'child', c)" />
                                <el-button link :icon="Delete" type="danger"
                                    @click.stop="handleDelete('child', c.id)" />
                            </div>
                        </el-menu-item>
                    </el-menu>
                    <el-empty v-else description="請先選擇一個父分類" />
                </el-card>
            </el-col>

            <el-col :span="12">
                <el-card class="box-card">
                    <template #header>
                        <div class="card-header">
                            <span>對戰關卡 (Task)</span>
                            <el-button type="primary" :icon="Plus" circle :disabled="!selectedChild"
                                @click="openDialog('create', 'stage')" />
                        </div>
                    </template>
                    <el-table v-if="selectedChild" :data="filteredStages" border height="600px">
                        <el-table-column prop="id" label="關卡ID" />
                        <el-table-column prop="name" label="關卡名稱" />
                        <el-table-column prop="npc.name" label="關聯 NPC" />
                        <el-table-column prop="targets" label="目標類型" />
                        <el-table-column label="操作" width="120">
                            <template #default="{ row }">
                                <el-button link :icon="Edit" @click="openDialog('edit', 'stage', row)" />
                                <el-button link :icon="Delete" type="danger"
                                    @click.stop="handleDelete('stage', row.id)" />
                            </template>
                        </el-table-column>
                    </el-table>
                    <el-empty v-else description="請先選擇一個子分類" />
                </el-card>
            </el-col>
        </el-row>

        <el-dialog v-model="dialogState.visible" :title="dialogState.title" width="800px" top="5vh">
            <el-form v-if="dialogState.type === 'parent'" :model="formData" label-width="80px">
                <el-form-item label="名稱"><el-input v-model="formData.name" /></el-form-item>
                <el-form-item label="描述"><el-input type="textarea" v-model="formData.description" /></el-form-item>
            </el-form>
            <el-form v-else-if="dialogState.type === 'child'" :model="formData" label-width="80px">
                <el-form-item label="父分類">
                    <el-select v-model="formData.parentId" :disabled="dialogState.mode === 'edit'">
                        <el-option v-for="p in parentCategories" :key="p.id" :label="p.name" :value="p.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="名稱"><el-input v-model="formData.name" /></el-form-item>
                <el-form-item label="描述"><el-input type="textarea" v-model="formData.description" /></el-form-item>
            </el-form>

            <el-form v-else-if="dialogState.type === 'stage'" :model="formData" label-width="100px" @submit.prevent>
                <el-form-item label="關卡名稱" required>
                    <el-input v-model="formData.name" />
                </el-form-item>
                <el-form-item label="關聯 NPC">
                    <el-select v-model="formData.npcId" placeholder="選擇一個 NPC" clearable filterable>
                        <el-option v-for="n in npcs" :key="n.id" :label="n.name" :value="n.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="背景故事" required>
                    <el-input type="textarea" :rows="3" v-model="formData.backstory" />
                </el-form-item>

                <el-divider>關卡目標</el-divider>
                <div v-for="(target, index) in formData.targets" :key="`target-${index}`" class="dynamic-item">
                    <el-input v-model="formData.targets[index]" :placeholder="`目標描述 ${index + 1}`"
                        style="flex-grow: 1; margin-right: 10px;" />
                    <el-button type="danger" circle @click="removeTarget(index)">
                        <el-icon>
                            <Delete />
                        </el-icon>
                    </el-button>
                </div>
                <el-button @click="addTarget" style="margin-top: 10px;">新增目標</el-button>

                <el-divider>關卡獎勵</el-divider>
                <div v-for="(reward, index) in formData.rewards" :key="`reward-${index}`" class="dynamic-item">
                    <el-select v-model="reward.type" placeholder="獎勵類型" style="width: 220px; margin-right: 10px;"
                        @change="onRewardTypeChange(reward)">
                        <el-option v-for="item in questRewardTypeConfig" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>

                    <el-input-number v-model="reward.count" :min="1" placeholder="數量"
                        style="width: 150px; margin-right: 10px;" />

                    <template v-if="getRewardConfig(reward.type)?.hasMetadata">
                        <el-input v-for="field in getRewardConfig(reward.type).metadataFields" :key="field.key"
                            :model-value="getNestedProperty(reward.metadata, field.path)"
                            @update:modelValue="setNestedProperty(reward.metadata, field.path, $event)"
                            :placeholder="field.placeholder" style="width: 250px; margin-right: 10px;" />
                    </template>

                    <el-button type="danger" circle @click="removeReward(index)">
                        <el-icon>
                            <Delete />
                        </el-icon>
                    </el-button>
                </div>
                <el-button @click="addReward" style="margin-top: 10px;">新增獎勵</el-button>
            </el-form>

            <template #footer>
                <el-button @click="dialogState.visible = false">取消</el-button>
                <el-button type="primary" @click="submitForm">確定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import parentApi from '../api/battleParentCategory.api';
import childApi from '../api/battleChildCategory.api';
import stageApi from '../api/battleStage.api';
import type { BattleParentCategoryDto, BattleChildCategoryDto, BattleStageDto } from '@/types/dto/battle.dto';
import npcApi from '../api/npc.api'; // <--- 新增：引入 NPC API
import {
    questTemplateTypeConfig,
    questRequirementTypeConfig,
    questRewardTypeConfig,
} from '../config/questConfig'; // 引入設定檔
import { BattleTargetType } from '@/types/dto/battle.dto';
import type { NpcDto } from '@/types/dto/npc.dto';
// 引入 DTO 類型


// --- State ---
const parentCategories = ref<BattleParentCategoryDto[]>([]);
const childCategories = ref<BattleChildCategoryDto[]>([]);
const stages = ref<BattleStageDto[]>([]);
const npcs = ref<NpcDto[]>([]);

const selectedParent = ref<BattleParentCategoryDto | null>(null);
const selectedChild = ref<BattleChildCategoryDto | null>(null);

const dialogState = reactive({ visible: false, title: '', type: 'parent', mode: 'create' });
const formData = ref<any>({});
const getRewardConfig = (type: string) => questRewardTypeConfig.find(c => c.value === type);

const getNestedProperty = (obj: Record<string, any>, path: string[]) => {
    if (!obj || !path) return '';
    return path.reduce((acc, part) => acc && acc[part], obj);
};

const setNestedProperty = (obj: Record<string, any>, path: string[], value: any) => {
    if (!path) return;
    const pathCopy = [...path];
    const lastKey = pathCopy.pop();
    if (!lastKey) return;

    const parent = pathCopy.reduce((acc, part) => {
        if (!acc[part]) acc[part] = {};
        return acc[part];
    }, obj);
    parent[lastKey] = value;
};



// --- Computed ---
const filteredChildCategories = computed(() => {
    if (!selectedParent.value) return [];
    return childCategories.value.filter(c => c.parent.id === selectedParent.value!.id);
});

const filteredStages = computed(() => {
    if (!selectedChild.value) return [];
    return stages.value.filter(s => s.category.id === selectedChild.value!.id);
});

// --- Watchers ---
watch(selectedParent, (newParent) => {
    selectedChild.value = null; // 重置子分類選擇
    if (newParent && !childCategories.value.some(c => c.parent.id === newParent.id)) {
        fetchAllChildCategories();
    }
});
watch(selectedChild, (newChild) => {
    if (newChild && !stages.value.some(s => s.category.id === newChild.id)) {
        fetchAllStages();
    }
});


// --- Methods ---
const fetchAllParentCategories = async () => {
    parentCategories.value = (await parentApi.getAll()).data;
};
const fetchAllChildCategories = async () => {
    childCategories.value = (await childApi.getAll()).data;
};
const fetchAllStages = async () => {
    stages.value = (await stageApi.getAll()).data;
};

const fetchAllNpcs = async () => { // <--- 新增：獲取 NPC 數據
    try {
        npcs.value = (await npcApi.getAll()).data;
    } catch (e) {
        ElMessage.error('獲取 NPC 列表失敗');
    }
};

const addReward = () => {
    if (!formData.value.rewards) {
        formData.value.rewards = [];
    }
    formData.value.rewards.push({ type: questRewardTypeConfig, count: 100, metadata: {} });
};
const removeReward = (index: number) => {
    formData.value.rewards.splice(index, 1);
};

const addTarget = () => {
    if (!formData.value.targets) {
        formData.value.targets = [];
    }
    formData.value.targets.push(''); // 新增一個空的目標描述
};
const removeTarget = (index: number) => {
    formData.value.targets.splice(index, 1);
};


const handleParentSelect = (id: string) => {
    selectedParent.value = parentCategories.value.find(p => p.id === id) || null;
};
const handleChildSelect = (id: string) => {
    selectedChild.value = childCategories.value.find(c => c.id === id) || null;
};

const openDialog = (mode: 'create' | 'edit', type: 'parent' | 'child' | 'stage', data: any = null) => {
    dialogState.mode = mode;
    dialogState.type = type;
    dialogState.visible = true;

    if (mode === 'create') {
        dialogState.title = `新增${{ parent: '父分類', child: '子分類', stage: '關卡' }[type]}`;
        formData.value = { parentId: selectedParent.value?.id, childCategoryId: selectedChild.value?.id };
        if (type === 'stage') {
            formData.value = {
                name: '',
                backstory: '',
                targets: [], // <-- 修改預設值
                childCategoryId: selectedChild.value?.id,
                npcId: null,
                rewards: [],
            };
        }
    } else {
        dialogState.title = `編輯${{ parent: '父分類', child: '子分類', stage: '關卡' }[type]}`;
        formData.value = { ...data, parentId: data.parent?.id, childCategoryId: data.category?.id };
        if (type === 'stage') {
            // 深拷貝以避免直接修改表格數據
            formData.value = JSON.parse(JSON.stringify(data));
            // 確保關聯ID被正確賦值
            formData.value.childCategoryId = data.category?.id;
            formData.value.npcId = data.npc?.id;
        }
    }
};

const handleDelete = async (type: 'parent' | 'child' | 'stage', id: string) => {
    await ElMessageBox.confirm('確定刪除嗎？', '警告', { type: 'warning' });
    try {
        if (type === 'parent') await parentApi.delete(id);
        if (type === 'child') await childApi.delete(id);
        if (type === 'stage') await stageApi.delete(id);
        ElMessage.success('刪除成功');
        // 刷新對應的列表
        if (type === 'parent') fetchAllParentCategories();
        if (type === 'child') fetchAllChildCategories();
        if (type === 'stage') fetchAllStages();
    } catch (e) {
        if (e !== 'cancel') ElMessage.error('刪除失敗');
    }
};

const submitForm = async () => {
    const { mode, type } = dialogState;
    const api = { parent: parentApi, child: childApi, stage: stageApi }[type];
    const refresh = { parent: fetchAllParentCategories, child: fetchAllChildCategories, stage: fetchAllStages }[type];

    try {
        if (mode === 'create') {
            delete formData.value.id
            await api!.create(formData.value);
        } else {
            await api!.update(formData.value.id, formData.value);
        }
        ElMessage.success('操作成功');
        dialogState.visible = false;
        if (refresh) refresh();
    } catch (e) {
        ElMessage.error('操作失敗');
    }
};

onMounted(() => {
    fetchAllParentCategories();
    fetchAllChildCategories();
    fetchAllStages();
    fetchAllNpcs();
});
</script>

<style scoped>
.page-container {
    padding: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.el-menu {
    border-right: none;
}

.el-menu-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.menu-item-text {
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.box-card {
    height: 700px;
}
</style>