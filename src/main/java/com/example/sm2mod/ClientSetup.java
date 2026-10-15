package com.example.sm2mod;

import net.minecraft.world.entity.EquipmentSlot;
import net.minecraftforge.api.distmarker.Dist;
import net.minecraftforge.client.event.EntityRenderersEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

@Mod.EventBusSubscriber(modid = Sm2Mod.MODID, bus = Mod.EventBusSubscriber.Bus.MOD, value = Dist.CLIENT)
public class ClientSetup {
    @SubscribeEvent
    public static void registerRenderers(EntityRenderersEvent.RegisterRenderers event) {
        event.registerEntityRenderer(ModEntities.BOLT.get(),
                ctx -> new GlowProjectileRenderer<BoltProjectile>(ctx, ModItems.BOLT_PROJECTILE));
        event.registerEntityRenderer(ModEntities.MELTA.get(),
                ctx -> new GlowProjectileRenderer<MeltaProjectile>(ctx, ModItems.MELTA_PROJECTILE));
        event.registerEntityRenderer(ModEntities.GRENADE.get(), GrenadeRenderer::new);
    }

    @SubscribeEvent
    public static void registerLayers(EntityRenderersEvent.RegisterLayerDefinitions event) {
        for (EquipmentSlot slot : PowerArmorClient.SLOTS) {
            event.registerLayerDefinition(PowerArmorClient.layer(slot), () -> PowerArmorModel.create(slot));
        }
    }
}
