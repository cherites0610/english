<template>
    <div class="page-container">
        <h1>任務模板管理</h1>
        <el-button type="primary" @click="handleCreate" style="margin-bottom: 20px;">新增任務模板</el-button>

        <el-table :data="quests" v-loading="loading" border stripe>
            <el-table-column prop="title" label="標題" width="250" />
            <el-table-column prop="type" label="類型" width="120" />
            <el-table-column prop="description" label="描述" show-overflow-tooltip />
            <el-table-column prop="questKey" label="任務key" show-overflow-tooltip />
            <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                    <el-button link type="primary" @click="handleEdit(row)">編輯</el-button>
                    <el-button link type="danger" @click="handleDelete(row.id)">刪除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" top="5vh" :close-on-click-modal="false">
            <el-form :model="currentQuest" ref="formRef" label-width="100px" @submit.prevent>

                <el-form-item label="任務標題" prop="title" required>
                    <el-input v-model="currentQuest.title" />
                </el-form-item>
                <el-form-item label="任務描述" prop="description" required>
                    <el-input type="textarea" v-model="currentQuest.description" />
                </el-form-item>
                <el-form-item label="任務類型" prop="type" required>
                    <el-select v-model="currentQuest.type" placeholder="請選擇類型">
                        <el-option v-for="item in questTemplateTypeConfig" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="Quest Key" prop="questKey">
                    <el-input v-model="currentQuest.questKey" placeholder="可選，用於主線等特殊任務" />
                </el-form-item>

                <el-divider>任務需求</el-divider>
                <div v-for="(req, index) in currentQuest.requirements" :key="`req-${index}`" class="dynamic-item">
                    <el-select v-model="req.type" placeholder="需求類型" style="width: 220px; margin-right: 10px;">
                        <el-option v-for="item in questRequirementTypeConfig" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                    <el-input-number v-model="req.count" :min="1" placeholder="數量"
                        style="width: 150px; margin-right: 10px;" />
                    <el-button type="danger" circle @click="removeRequirement(index)">
                        <el-icon>
                            <Delete />
                        </el-icon>
                    </el-button>
                </div>
                <el-button @click="addRequirement" style="margin-top: 10px;">新增需求</el-button>

                <el-divider>任務獎勵</el-divider>
                <div v-for="(reward, index) in currentQuest.rewards" :key="`reward-${index}`" class="dynamic-item">
                    <el-select v-model="reward.type" placeholder="獎勵類型" style="width: 220px; margin-right: 10px;"
                        @change="onRewardTypeChange(reward)">
                        <el-option v-for="item in questRewardTypeConfig" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                    <el-input-number v-model="reward.count" :min="1" placeholder="數量"
                        style="width: 150px; margin-right: 10px;" />

                    <template v-if="getRewardConfig(reward.type).hasMetadata">
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
                <div class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitForm">確定</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance } from 'element-plus'; // 引入 FormInstance 類型
import { Delete } from '@element-plus/icons-vue';
import questApi from '../api/quest.api'; // 引入 API 服務
import {
    questTemplateTypeConfig,
    questRequirementTypeConfig,
    questRewardTypeConfig,
} from '../config/questConfig'; // 引入設定檔
import type { QuestTemplateDto, CreateQuestTemplateDto } from '../types/dto/quest.dto'; // 引入 DTO 類型

// --- 類型定義 (Interfaces) ---
// 為需求和獎勵定義更明確的類型
interface QuestRequirement {
    type: string;
    count: number;
}

interface QuestReward {
    type: string;
    count: number;
    metadata: Record<string, any>; // 使用 Record<string, any> 來表示 metadata
}

// 表單資料的完整類型
interface QuestFormData extends Omit<CreateQuestTemplateDto, 'requirements' | 'rewards'> {
    id: string | null;
    requirements: QuestRequirement[];
    rewards: QuestReward[];
}


// --- 響應式狀態 ---
const quests = ref<QuestTemplateDto[]>([]);
const loading = ref(true);
const dialogVisible = ref(false);
const dialogTitle = ref('');
// 明確指定 formRef 的類型
const formRef = ref<FormInstance | null>(null);

// 預設表單資料
const createDefaultFormData = (): QuestFormData => ({
    id: null,
    title: '',
    description: '',
    type: questTemplateTypeConfig[0]?.value || 'MAIN', // 使用設定檔中的預設值
    questKey: '',
    requirements: [],
    rewards: [],
});

const currentQuest = reactive<QuestFormData>(createDefaultFormData());

// --- 輔助函數 ---
const getRewardConfig = (type: string) => questRewardTypeConfig.find(c => c.value === type)!;

// 【已修正】安全的獲取和設定巢狀屬性
const getNestedProperty = (obj: Record<string, any>, path: readonly string[]): any => {
    if (!obj || !path) return undefined;
    return path.reduce((acc, part) => acc && acc[part], obj);
};

const setNestedProperty = (obj: Record<string, any>, path: readonly string[], value: any) => {
    if (!obj || !path || path.length === 0) return;

    // 【關鍵修正】
    // 我們不再使用 .pop() 來修改原始的 path 陣列。
    // 而是使用 .slice(0, -1) 來 "複製" 一個不包含最後一個元素的新陣列。
    // .slice() 不會修改原始陣列，因此可以安全地用在 readonly 陣列上。
    const parentPath = path.slice(0, -1);
    const lastKey = path[path.length - 1]; // 直接讀取最後一個元素，不修改陣列。

    const parent = parentPath.reduce((acc, part) => {
        if (!acc[part]) {
            acc[part] = {};
        }
        return acc[part];
    }, obj);

    parent[lastKey] = value;
};

// 【新增】確保從後端來的資料有完整的 metadata 結構，以避免 v-model 綁定到 undefined
const ensureMetadataStructure = (reward: QuestReward) => {
    const config = getRewardConfig(reward.type);
    if (config?.hasMetadata) {
        // 如果 metadata 不存在，先初始化
        if (!reward.metadata) {
            reward.metadata = {};
        }
        config.metadataFields!.forEach(field => {
            // 使用一個臨時變數來走訪路徑
            let currentLevel = reward.metadata;
            field.path.forEach((part, index) => {
                // 如果是最後一個 key
                if (index === field.path.length - 1) {
                    // 如果這個 key 不存在，就給它一個初始空字串
                    if (currentLevel[part] === undefined) {
                        currentLevel[part] = '';
                    }
                } else {
                    // 如果中間的路徑不存在，就建立一個空物件
                    if (!currentLevel[part]) {
                        currentLevel[part] = {};
                    }
                    currentLevel = currentLevel[part];
                }
            });
        });
    }
};


// --- 動態表單方法 ---
const addRequirement = () => {
    currentQuest.requirements.push({ type: questRequirementTypeConfig[0].value, count: 1 });
};
const removeRequirement = (index: number) => {
    currentQuest.requirements.splice(index, 1);
};

const addReward = () => {
    const newReward: QuestReward = {
        type: questRewardTypeConfig[0].value,
        count: 1,
        metadata: {} // 新增時給一個空的 metadata
    };
    // 確保新增的獎勵也有正確的初始 metadata 結構
    ensureMetadataStructure(newReward);
    currentQuest.rewards.push(newReward);
};
const removeReward = (index: number) => {
    currentQuest.rewards.splice(index, 1);
};

// 當獎勵類型改變時，重置 metadata
const onRewardTypeChange = (reward: QuestReward) => {
    reward.metadata = {}; // 清空舊的
    ensureMetadataStructure(reward); // 建立新的結構
};


// --- CRUD 方法 ---
const fetchQuests = async () => {
    loading.value = true;
    try {
        const response = await questApi.getAllTemplates();
        quests.value = response.data;
    } catch (error) {
        console.error('獲取任務列表失敗', error);
    } finally {
        loading.value = false;
    }
};

const handleCreate = () => {
    Object.assign(currentQuest, createDefaultFormData());
    dialogTitle.value = '新增任務模板';
    dialogVisible.value = true;
    // 清除上一次的驗證結果
    formRef.value?.clearValidate();
};

const handleEdit = (row: QuestTemplateDto) => {
    // 使用深拷貝以避免直接修改表格中的原始數據
    const rowCopy = JSON.parse(JSON.stringify(row));

    // 【已修正】對每一個獎勵，安全地檢查並建立 metadata 結構，而不是直接清空
    if (rowCopy.rewards) {
        rowCopy.rewards.forEach(ensureMetadataStructure);
    }

    Object.assign(currentQuest, rowCopy);
    dialogTitle.value = '編輯任務模板';
    dialogVisible.value = true;
    // 清除上一次的驗證結果
    formRef.value?.clearValidate();
};

const handleDelete = async (id: string) => {
    try {
        await ElMessageBox.confirm('此操作將永久刪除該任務模板，是否繼續？', '警告', {
            confirmButtonText: '確定刪除',
            cancelButtonText: '取消',
            type: 'warning',
        });
        await questApi.deleteTemplate(id);
        ElMessage.success('刪除成功');
        await fetchQuests(); // 重新獲取列表
    } catch (error) {
        if (error !== 'cancel') {
            console.error('刪除失敗', error);
        }
    }
};

const submitForm = async () => {
    if (!formRef.value) return;
    try {
        const valid = await formRef.value.validate();
        if (valid) {
            // 創建一個 payload 的深拷貝以進行清理
            const payload = JSON.parse(JSON.stringify(currentQuest));

            // 清理 payload
            payload.rewards = payload.rewards
                .filter((reward: { type: any; }) => reward.type)
                .map((reward: { type: string; metadata: {}; }) => {
                    const config = getRewardConfig(reward.type);
                    if (!config?.hasMetadata || Object.keys(reward.metadata).length === 0) {
                        Reflect.deleteProperty(reward, 'metadata');
                    }
                    return reward;
                });
            payload.requirements = payload.requirements.filter((req: { type: any; }) => req.type);

            if (payload.id) {
                await questApi.updateTemplate(payload.id, payload);
                ElMessage.success('更新成功');
            } else {
                // 新增時不需要傳 id
                delete payload.id;
                await questApi.createTemplate(payload);
                ElMessage.success('新增成功');
            }
            dialogVisible.value = false;
            await fetchQuests(); // 重新獲取列表
        }
    } catch (error) {
        console.error('表單驗證或提交失敗', error);
    }
};

onMounted(fetchQuests);
</script>

<style scoped>
.page-container {
    padding: 20px;
}

.dynamic-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    padding: 10px;
    border-radius: 4px;
    background-color: #f9f9f9;
}

.dialog-footer {
    text-align: right;
}
</style>